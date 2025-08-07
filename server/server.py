import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

import jwt

from fastapi import Depends, FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles

from api_schema import (
    ExtractedContentResponse,
    LoginRequest,
    LoginResponse,
    ProjectCreateRequest,
    ProjectSchema,
    ProjectStatsResponse,
    QueryRequest,
    QueryResponse,
    TaskCreateRequest,
    TaskResponse,
)
from db import (
    delete_project_data,
    export_project_data,
    get_project_by_token,
    get_project_stats,
    get_projects,
    get_successful_tasks_by_project,
    init_db,
    save_project,
)
from rag_service import query_project_notes
from task_queue import TaskQueue

app = FastAPI(title="vibeScope", version="0.1.0")
security = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory if it doesn't exist
static_dir = "static"
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory="static"), name="static")

task_queue = TaskQueue()


def verify_project_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Dependency to verify project auth token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header required")

    token = credentials.credentials
    project = get_project_by_token(token)

    if not project:
        raise HTTPException(status_code=401, detail="Invalid project token")

    return project


def verify_system_token(authorization: str = Header(None)):
    """Verify system authentication token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        # Use SYSTEM_AUTH_PASSWORD as JWT secret
        secret = os.getenv("SYSTEM_AUTH_PASSWORD")
        if not secret:
            raise HTTPException(status_code=500, detail="System authentication not configured")
        
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Authentication endpoint
@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """System authentication endpoint"""
    system_password = os.getenv("SYSTEM_AUTH_PASSWORD")
    if not system_password:
        raise HTTPException(status_code=500, detail="System authentication not configured")
    
    if request.password != system_password:
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Generate JWT token with 24-hour expiration
    payload = {
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow(),
        "type": "system_auth"
    }
    
    token = jwt.encode(payload, system_password, algorithm="HS256")
    
    return LoginResponse(
        token=token,
        message="Login successful"
    )


# Add new endpoint for extension to get project info by token
@app.get("/projects/by-token/{token}")
async def get_project_by_token_endpoint(token: str) -> dict[str, str]:
    """Get project info by token - for extension validation"""
    project = get_project_by_token(token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"id": project["id"], "name": project["name"]}


@app.post("/tasks", response_model=TaskResponse)
async def create_task(request: TaskCreateRequest, project: dict = Depends(verify_project_token)) -> TaskResponse:
    if not request.url and not request.html:
        raise HTTPException(status_code=400, detail="either url or html is required")

    task_id = str(uuid.uuid4())
    task_data = {
        "id": task_id,
        "project_id": request.project_id,
        "url": request.url or "",
        "html": request.html,
        "status": "pending",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "error_msg": None,
    }

    task_queue.add_task(task_data)

    return TaskResponse(**task_data)


@app.get("/tasks/{project_id}", response_model=list[TaskResponse])
async def get_tasks_by_project(
    project_id: str,
    status: Optional[str] = Query(
        None, description="Filter by status: pending, processing, failed"
    ),
    project: dict = Depends(verify_project_token)
) -> list[TaskResponse]:
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    queue_tasks = []
    for task in task_queue.tasks.values():
        if task["project_id"] == project_id:
            if status is None or task["status"] == status:
                queue_tasks.append(TaskResponse(**task))

    if status != "success":
        return queue_tasks

    successful_tasks = get_successful_tasks_by_project(project_id)
    success_responses = []
    for task in successful_tasks:
        # Handle both old and new datetime formats
        created_at = task["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)

        success_response = TaskResponse(
            id=task["id"],
            project_id=project_id,
            url=task.get("url", ""),
            html=task.get("html"),
            status="success",
            created_at=created_at,
            updated_at=created_at,
            error_msg=None,
        )
        success_responses.append(success_response)

    if status == "success":
        return success_responses

    return queue_tasks + success_responses


@app.post("/tasks/{task_id}/retry")
async def retry_task(task_id: str, project: dict = Depends(verify_project_token)) -> dict[str, str]:
    if not task_id:
        raise HTTPException(status_code=400, detail="task_id is required")

    try:
        task_queue.retry_task(task_id)
        return {"message": f"task {task_id} retried successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/tasks/{task_id}/delete")
async def delete_task(task_id: str, project: dict = Depends(verify_project_token)) -> dict[str, str]:
    if not task_id:
        raise HTTPException(status_code=400, detail="task_id is required")

    try:
        task_queue.delete_task(task_id)
        return {"message": f"task {task_id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/projects", response_model=list[ProjectSchema])
async def list_projects(system_auth: dict = Depends(verify_system_token)) -> list[ProjectSchema]:
    projects = get_projects()
    return [ProjectSchema(**project) for project in projects]


@app.post("/projects", response_model=ProjectSchema)
async def create_project(request: ProjectCreateRequest, system_auth: dict = Depends(verify_system_token)) -> ProjectSchema:
    if not request.name:
        raise HTTPException(status_code=400, detail="name is required")

    project_id = str(uuid.uuid4())
    auth_token = secrets.token_urlsafe(32)  # Generate auth token

    project_data = {
        "id": project_id,
        "name": request.name,
        "auth_token": auth_token,
        "created_at": datetime.now().isoformat(),
    }

    save_project(project_data)

    return ProjectSchema(
        id=project_id,
        name=request.name,
        auth_token=auth_token,
        created_at=datetime.fromisoformat(project_data["created_at"]),
    )


@app.get("/projects/{project_id}/stats", response_model=ProjectStatsResponse)
async def get_project_statistics(project_id: str, project: dict = Depends(verify_project_token)) -> ProjectStatsResponse:
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    db_stats = get_project_stats(project_id)

    queue_stats = {"pending": 0, "processing": 0, "failed": 0}
    for task in task_queue.tasks.values():
        if task["project_id"] == project_id:
            status = task["status"]
            if status in queue_stats:
                queue_stats[status] += 1

    total_tasks = db_stats["successful_tasks"] + sum(queue_stats.values())

    return ProjectStatsResponse(
        total_tasks=total_tasks,
        pending_tasks=queue_stats["pending"],
        processing_tasks=queue_stats["processing"],
        failed_tasks=queue_stats["failed"],
        successful_tasks=db_stats["successful_tasks"],
        token_usage=db_stats["token_usage"],
        processing_time_seconds=db_stats["processing_time_seconds"],
    )


@app.get("/projects/{project_id}/export")
async def export_project(project_id: str, project: dict = Depends(verify_project_token)) -> dict[str, Any]:
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    try:
        return export_project_data(project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, project: dict = Depends(verify_project_token)) -> dict[str, str]:
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    try:
        delete_project_data(project_id)
        return {"message": f"project {project_id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get(
    "/projects/{project_id}/content", response_model=list[ExtractedContentResponse]
)
async def get_extracted_content(project_id: str, project: dict = Depends(verify_project_token)) -> list[ExtractedContentResponse]:
    """Get extracted content for a project with full nested structure"""
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    successful_tasks = get_successful_tasks_by_project(project_id)
    content_responses = []

    for task in successful_tasks:
        # Transform database record to API response
        try:
            # Handle both old flat format and new DBSchema format
            if "base_content" in task:
                # New DBSchema format - direct transformation
                from data_schema import DBSchema

                # Convert datetime string back to datetime object if needed
                if isinstance(task.get("created_at"), str):
                    task["created_at"] = datetime.fromisoformat(task["created_at"])

                db_record = DBSchema(**task)
                content_response = ExtractedContentResponse.from_db_schema(db_record)
            else:
                # Legacy flat format - convert to new structure
                from data_schema import (
                    AuthorProfileModel,
                    BaseContentModel,
                    CommentsModel,
                    LinksModel,
                    MetadataModel,
                )

                note_content = task.get("note_content", {})
                user_profile = task.get("user_profile", {})

                content_response = ExtractedContentResponse(
                    id=task["id"],
                    project_id=task["project_id"],
                    url=task.get("url"),
                    html=task.get("html"),
                    base_content=BaseContentModel(
                        title=note_content.get("title", ""),
                        content=note_content.get("content", ""),
                        author_name=note_content.get("author_name", ""),
                        publish_date=note_content.get("date", ""),
                    ),
                    links=LinksModel(
                        author_avatar_url=note_content.get("author_avatar_url", ""),
                        author_profile_url=note_content.get("author_profile_url", ""),
                        image_urls=note_content.get("image_urls", []),
                    ),
                    metadata=MetadataModel(
                        tags=note_content.get("tags", []),
                        like_count=note_content.get("like_count", 0),
                        comment_count=note_content.get("comment_count", 0),
                        favorite_count=note_content.get("favorite_count", 0),
                        location=note_content.get("location", "未知"),
                    ),
                    comments=[
                        CommentsModel(
                            comment_content=c.get("comment", ""),
                            comment_author_name=c.get("comment_author_name", ""),
                            comment_publish_date=c.get("comment_publish_date", ""),
                            first_reply_to_comment=c.get("reply_to_comment", ""),
                        )
                        for c in note_content.get("comments", [])
                    ],
                    author_profile=AuthorProfileModel(
                        author_name=user_profile.get("author_name", ""),
                        location=user_profile.get("location", "未知"),
                        author_avatar_url=user_profile.get("author_avatar_url", ""),
                        introduction=user_profile.get("introduction", ""),
                        related_topics=user_profile.get("related_topics", []),
                        interests=user_profile.get("interests", []),
                        careers=[user_profile.get("career", "")]
                        if user_profile.get("career")
                        else [],
                    ),
                    image_assets=task.get("image_assets", []),
                    token_usage=task.get("token_usage", 0),
                    created_at=datetime.fromisoformat(task["created_at"])
                    if isinstance(task["created_at"], str)
                    else task["created_at"],
                    processing_time_seconds=task.get("processing_time_seconds", 0),
                )

            content_responses.append(content_response)

        except Exception as e:
            # Skip malformed records and continue
            print(
                f"Warning: Skipping malformed record {task.get('id', 'unknown')}: {e}"
            )
            continue

    return content_responses


@app.get("/queue/status")
async def get_queue_status(project: dict = Depends(verify_project_token)) -> dict[str, int]:
    return task_queue.get_queue_stats()


@app.post("/query", response_model=QueryResponse)
async def query_project(request: QueryRequest, project: dict = Depends(verify_project_token)) -> QueryResponse:
    """Query project notes using two-factor RAG pipeline"""
    logging.info(f"Query request received: project_id={request.project_id}, question_length={len(request.question)}")

    if not request.project_id:
        logging.error("Query failed: project_id is required")
        raise HTTPException(status_code=400, detail="project_id is required")

    if not request.question.strip():
        logging.error("Query failed: question cannot be empty")
        raise HTTPException(status_code=400, detail="question cannot be empty")

    try:
        logging.info(f"Starting query processing for project {request.project_id}")
        result = await query_project_notes(request.project_id, request.question)
        logging.info(f"Query completed successfully: {len(result.relevant_note_ids)} relevant notes found")
        return result
    except Exception as e:
        logging.error(f"Query failed with exception: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")




@app.on_event("startup")
async def startup_event():
    # Get logger instance for startup
    startup_logger = logging.getLogger(__name__)
    startup_logger.info("Starting up vibeScope")

    init_db()
    startup_logger.info("Database initialized")


    import asyncio
    asyncio.create_task(task_queue.start_dispatcher())
    startup_logger.info("Task queue dispatcher started")


if __name__ == "__main__":
    import os

    from dotenv import load_dotenv

    load_dotenv()

    required_env_vars = ["OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL", "SYSTEM_AUTH_PASSWORD"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]

    if missing_vars:
        raise ValueError(f"missing required environment variables: {missing_vars}")

    print("✓ Environment validation passed")

    init_db()
    main_logger = logging.getLogger(__name__)
    main_logger.info("✓ Database and auth tables initialized")
    print("✓ Database and auth tables initialized")

    import asyncio

    asyncio.create_task(task_queue.start_dispatcher())
    print("✓ Task queue dispatcher started")

    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
