from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, List, Any, Optional
import uuid
from datetime import datetime

from schema import TaskCreateRequest, TaskResponse, ProjectSchema, ProjectStatsResponse, ProjectCreateRequest
from db import init_db, save_project, get_projects, get_successful_tasks_by_project, get_project_stats, export_project_data
from task_queue import TaskQueue

app = FastAPI(title="Social Media Research Assistant", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

task_queue = TaskQueue()

@app.post("/tasks", response_model=TaskResponse)
async def create_task(request: TaskCreateRequest) -> TaskResponse:
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
        "error_msg": None
    }
    
    task_queue.add_task(task_data)
    
    return TaskResponse(**task_data)

@app.get("/tasks/{project_id}", response_model=List[TaskResponse])
async def get_tasks_by_project(
    project_id: str,
    status: Optional[str] = Query(None, description="Filter by status: pending, processing, failed")
) -> List[TaskResponse]:
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
        success_response = TaskResponse(
            id=task["id"],
            project_id=project_id,
            url=task.get("url", ""),
            html=task.get("html"),
            status="success",
            created_at=datetime.fromisoformat(task["created_at"]),
            updated_at=datetime.fromisoformat(task["created_at"]),
            error_msg=None
        )
        success_responses.append(success_response)
    
    if status == "success":
        return success_responses
    
    return queue_tasks + success_responses

@app.post("/tasks/{task_id}/retry")
async def retry_task(task_id: str) -> Dict[str, str]:
    if not task_id:
        raise HTTPException(status_code=400, detail="task_id is required")
    
    try:
        task_queue.retry_task(task_id)
        return {"message": f"task {task_id} retried successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/tasks/{task_id}/delete")
async def delete_task(task_id: str) -> Dict[str, str]:
    if not task_id:
        raise HTTPException(status_code=400, detail="task_id is required")
    
    try:
        task_queue.delete_task(task_id)
        return {"message": f"task {task_id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/projects", response_model=List[ProjectSchema])
async def list_projects() -> List[ProjectSchema]:
    projects = get_projects()
    return [ProjectSchema(**project) for project in projects]

@app.post("/projects", response_model=ProjectSchema)
async def create_project(request: ProjectCreateRequest) -> ProjectSchema:
    if not request.name:
        raise HTTPException(status_code=400, detail="name is required")
    
    project_id = str(uuid.uuid4())
    project_data = {
        "id": project_id,
        "name": request.name,
        "created_at": datetime.now().isoformat()
    }
    
    save_project(project_data)
    
    return ProjectSchema(
        id=project_id,
        name=request.name,
        created_at=datetime.fromisoformat(project_data["created_at"])
    )

@app.get("/projects/{project_id}/stats", response_model=ProjectStatsResponse)
async def get_project_statistics(project_id: str) -> ProjectStatsResponse:
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
        processing_time_seconds=db_stats["processing_time_seconds"]
    )

@app.get("/projects/{project_id}/export")
async def export_project(project_id: str) -> Dict[str, Any]:
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    
    try:
        return export_project_data(project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/queue/status")
async def get_queue_status() -> Dict[str, int]:
    return task_queue.get_queue_stats()

@app.on_event("startup")
async def startup_event():
    init_db()
    import asyncio
    asyncio.create_task(task_queue.start_dispatcher())

if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    required_env_vars = ["OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        raise ValueError(f"missing required environment variables: {missing_vars}")
    
    print("✓ Environment validation passed")
    
    init_db()
    print("✓ Database initialized")
    
    import asyncio
    asyncio.create_task(task_queue.start_dispatcher())
    print("✓ Task queue dispatcher started")
    
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )