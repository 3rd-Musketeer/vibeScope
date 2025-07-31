from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from data_schema import DBSchema, BaseContentModel, LinksModel, MetadataModel, CommentsModel, AuthorProfileModel

# API Request Models
class TaskCreateRequest(BaseModel):
    project_id: str = Field(description="Project ID to add task to")
    url: Optional[str] = Field(default=None, description="URL to extract")
    html: Optional[str] = Field(default=None, description="HTML content to extract")

class ProjectCreateRequest(BaseModel):
    name: str = Field(description="Project name")

# Query/RAG Models
class QueryRequest(BaseModel):
    project_id: str = Field(description="Project ID to query")
    question: str = Field(description="Question to ask about the project notes")

class QueryResponse(BaseModel):
    answer: str = Field(description="Aggregated answer to the question")
    relevant_note_ids: list[str] = Field(description="IDs of notes that were relevant to the question")

# Task Management Models
class TaskSchema(BaseModel):
    id: str = Field(description="Unique task identifier")
    project_id: str = Field(description="Project this task belongs to")
    url: str = Field(description="URL to extract content from")  
    html: Optional[str] = Field(default=None, description="HTML content if provided instead of URL")
    status: str = Field(description="Task status: pending, processing, failed")
    created_at: datetime = Field(description="Task creation timestamp")
    updated_at: datetime = Field(description="Task last update timestamp")
    error_msg: Optional[str] = Field(default=None, description="Error message if task failed")

class TaskResponse(BaseModel):
    id: str = Field(description="Unique task identifier")
    project_id: str = Field(description="Project this task belongs to")
    url: str = Field(description="URL to extract content from")
    html: Optional[str] = Field(default=None, description="HTML content if provided instead of URL")
    status: str = Field(description="Task status: pending, processing, failed")
    created_at: datetime = Field(description="Task creation timestamp")
    updated_at: datetime = Field(description="Task last update timestamp")
    error_msg: Optional[str] = Field(default=None, description="Error message if task failed")

# Project Management Models
class ProjectSchema(BaseModel):
    id: str = Field(description="Unique project identifier")
    name: str = Field(description="Project name")
    created_at: datetime = Field(description="Project creation timestamp")

class ProjectStatsResponse(BaseModel):
    total_tasks: int = Field(description="Total number of tasks in project")
    pending_tasks: int = Field(description="Number of tasks waiting to be processed")
    processing_tasks: int = Field(description="Number of tasks currently being processed")
    failed_tasks: int = Field(description="Number of tasks that failed processing")
    successful_tasks: int = Field(description="Number of tasks that completed successfully")
    token_usage: int = Field(description="Total LLM tokens consumed by project")
    processing_time_seconds: int = Field(description="Total processing time excluding wait time")

# Extracted Content API Response (transformed from DBSchema)
class ExtractedContentResponse(BaseModel):
    id: str = Field(description="Unique extraction identifier")
    project_id: str = Field(description="Project this extraction belongs to")
    url: Optional[str] = Field(default=None, description="URL of the extracted content")
    html: Optional[str] = Field(default=None, description="HTML content if provided instead of URL")
    base_content: BaseContentModel = Field(description="Core content extraction")
    links: LinksModel = Field(description="URL links and assets")
    metadata: MetadataModel = Field(description="Platform metadata and engagement")
    comments: list[CommentsModel] = Field(description="Comments and replies")
    author_profile: AuthorProfileModel = Field(description="Author profile information")
    image_assets: list[str] = Field(default_factory=list, description="Asset UUIDs for images")
    avatar_asset: str = Field(default="", description="Asset UUID for author avatar")
    token_usage: int = Field(description="LLM token consumption")
    created_at: datetime = Field(description="Extraction timestamp")
    processing_time_seconds: int = Field(description="Processing time excluding wait time")

    @classmethod
    def from_db_schema(cls, db_record: DBSchema) -> "ExtractedContentResponse":
        """Transform DBSchema to API response format"""
        return cls(
            id=db_record.id,
            project_id=db_record.project_id,
            url=db_record.url,
            html=db_record.html,
            base_content=db_record.base_content,
            links=db_record.links,
            metadata=db_record.metadata,
            comments=db_record.comments,
            author_profile=db_record.author_profile,
            image_assets=db_record.image_assets,
            avatar_asset=db_record.avatar_asset,
            token_usage=db_record.token_usage,
            created_at=db_record.created_at,
            processing_time_seconds=db_record.processing_time_seconds
        )

if __name__ == "__main__":
    from datetime import datetime
    import uuid
    from data_schema import DBSchema, BaseContentModel, LinksModel, MetadataModel, CommentsModel, AuthorProfileModel
    
    # Test TaskCreateRequest
    task_request = TaskCreateRequest(
        project_id="test-project",
        url="https://example.com/post/123"
    )
    print(f"✓ TaskCreateRequest validation passed: {task_request.project_id}")
    
    # Test ProjectCreateRequest
    project_request = ProjectCreateRequest(name="Test Project")
    print(f"✓ ProjectCreateRequest validation passed: {project_request.name}")
    
    # Test TaskSchema
    task_data = {
        "id": str(uuid.uuid4()),
        "project_id": "test-project",
        "url": "https://example.com/post/123",
        "html": None,
        "status": "pending",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "error_msg": None
    }
    task = TaskSchema(**task_data)
    print(f"✓ TaskSchema validation passed: {task.id}")
    
    # Test TaskResponse
    response = TaskResponse(**task_data)
    print(f"✓ TaskResponse validation passed: {response.status}")
    
    # Test ProjectSchema
    project = ProjectSchema(
        id="test-project",
        name="Test Project",
        created_at=datetime.now()
    )
    print(f"✓ ProjectSchema validation passed: {project.name}")
    
    # Test ProjectStatsResponse
    stats = ProjectStatsResponse(
        total_tasks=100,
        pending_tasks=10,
        processing_tasks=2,
        failed_tasks=3,
        successful_tasks=85,
        token_usage=50000,
        processing_time_seconds=1800
    )
    print(f"✓ ProjectStatsResponse validation passed: {stats.total_tasks} tasks")
    
    # Test ExtractedContentResponse transformation
    db_record = DBSchema(
        id=str(uuid.uuid4()),
        project_id="test-project",
        url="https://example.com/post/123",
        html=None,
        base_content=BaseContentModel(
            title="Test Post",
            content="Test **markdown** content",
            author_name="Test Author",
            publish_date="2024-01-15"
        ),
        links=LinksModel(
            author_avatar_url="https://example.com/avatar.jpg",
            author_profile_url="https://example.com/profile",
            image_urls=["https://example.com/image1.jpg"]
        ),
        metadata=MetadataModel(
            tags=["test"],
            like_count=100,
            comment_count=5,
            favorite_count=20,
            location="北京"
        ),
        comments=[],
        author_profile=AuthorProfileModel(
            author_name="Test Author",
            location="上海",
            author_avatar_url="https://example.com/avatar.jpg",
            introduction="Test author intro",
            related_topics=["AI"],
            interests=["Tech"],
            careers=["Engineer"]
        ),
        image_assets=["uuid-123"],
        avatar_asset="avatar-uuid-456",
        token_usage=1000,
        created_at=datetime.now(),
        processing_time_seconds=30
    )
    
    # Test transformation
    api_response = ExtractedContentResponse.from_db_schema(db_record)
    print(f"✓ ExtractedContentResponse transformation passed: {api_response.base_content.title}")
    print(f"✓ Nested structure: author='{api_response.author_profile.author_name}', likes={api_response.metadata.like_count}")
    
    print("All API schema validations completed successfully!")