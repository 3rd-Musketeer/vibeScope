from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TaskSchema(BaseModel):
    id: str = Field(description="Unique task identifier")
    project_id: str = Field(description="Project this task belongs to")
    url: str = Field(description="URL to extract content from")
    html: Optional[str] = Field(
        default=None, description="HTML content if provided instead of URL"
    )
    status: str = Field(description="Task status: pending, processing, failed")
    created_at: datetime = Field(description="Task creation timestamp")
    updated_at: datetime = Field(description="Task last update timestamp")
    error_msg: Optional[str] = Field(
        default=None, description="Error message if task failed"
    )


class ProjectSchema(BaseModel):
    id: str = Field(description="Unique project identifier")
    name: str = Field(description="Project name")
    created_at: datetime = Field(description="Project creation timestamp")


class ProjectCreateRequest(BaseModel):
    name: str = Field(description="Project name")


class TaskCreateRequest(BaseModel):
    project_id: str = Field(description="Project ID to add task to")
    url: Optional[str] = Field(default=None, description="URL to extract")
    html: Optional[str] = Field(default=None, description="HTML content to extract")


class TaskResponse(BaseModel):
    id: str = Field(description="Unique task identifier")
    project_id: str = Field(description="Project this task belongs to")
    url: str = Field(description="URL to extract content from")
    html: Optional[str] = Field(
        default=None, description="HTML content if provided instead of URL"
    )
    status: str = Field(description="Task status: pending, processing, failed")
    created_at: datetime = Field(description="Task creation timestamp")
    updated_at: datetime = Field(description="Task last update timestamp")
    error_msg: Optional[str] = Field(
        default=None, description="Error message if task failed"
    )


class ProjectStatsResponse(BaseModel):
    total_tasks: int = Field(description="Total number of tasks in project")
    pending_tasks: int = Field(description="Number of tasks waiting to be processed")
    processing_tasks: int = Field(
        description="Number of tasks currently being processed"
    )
    failed_tasks: int = Field(description="Number of tasks that failed processing")
    successful_tasks: int = Field(
        description="Number of tasks that completed successfully"
    )
    token_usage: int = Field(description="Total LLM tokens consumed by project")
    processing_time_seconds: int = Field(
        description="Total processing time excluding wait time"
    )


class RedNoteCommentSchema(BaseModel):
    comment: str = Field(default="", description="Comment of the note")
    reply_to_comment: str = Field(default="", description="First reply to the comment")


class RedNoteSchema(BaseModel):
    title: str = Field(default="", description="Title of the note")
    content: str = Field(default="", description="Content of the note by the author")
    tags: list[str] = Field(
        default_factory=list, description="Tag words of the note, without `#`"
    )
    date: str = Field(default="", description="Date of the note")
    like_count: int = Field(default=0, description="Like count of the note")
    comment_count: int = Field(default=0, description="Comment count of the note")
    favorite_count: int = Field(default=0, description="Favorite count of the note")
    location: str = Field(default="未知", description="IP location of the note")
    image_urls: list[str] = Field(
        default_factory=list, description="Image urls in main body"
    )
    video_urls: list[str] = Field(
        default_factory=list, description="Video urls in main body"
    )
    author_name: str = Field(default="", description="Author name")
    author_avatar_url: str = Field(default="", description="Author avatar url")
    author_profile_url: str = Field(default="", description="Author profile url")
    comments: list[RedNoteCommentSchema] = Field(
        default_factory=list, description="Comments of the note"
    )


class RedNoteUserProfileSchema(BaseModel):
    location: str = Field(default="未知", description="IP location of the user")
    author_name: str = Field(default="", description="Author name")
    author_avatar_url: str = Field(default="", description="Author avatar url")
    introduction: str = Field(default="", description="Introduction of the user")
    related_topics: list[str] = Field(
        default_factory=list, description="Related topics of the user, at most 3"
    )
    interests: list[str] = Field(
        default_factory=list, description="Interests of the user, at most 3"
    )
    career: str = Field(default="未知", description="Inferred career of the user")


# New extraction pipeline schemas
class BaseContentModel(BaseModel):
    title: str = Field(default="", description="Title of the post")
    content: str = Field(
        default="",
        description="Main content of the post, in markdown format, excluding urls.",
    )
    author_name: str = Field(default="", description="Author name")
    publish_date: str = Field(default="", description="Publish date of the post")


class LinksModel(BaseModel):
    author_avatar_url: str = Field(default="", description="Author avatar url")
    author_profile_url: str = Field(default="", description="Author profile url")
    image_urls: list[str] = Field(
        default_factory=list, description="Image urls in the post"
    )


class MetadataModel(BaseModel):
    tags: list[str] = Field(
        default_factory=list, description="Tag words of the post, without `#`"
    )
    like_count: int = Field(default=0, description="Like count of the post")
    comment_count: int = Field(default=0, description="Comment count of the post")
    favorite_count: int = Field(default=0, description="Favorite count of the post")
    location: str = Field(default="未知", description="IP location of the post")


class CommentsModel(BaseModel):
    comment_content: str = Field(default="", description="Comment content")
    comment_author_name: str = Field(default="", description="Comment author name")
    comment_publish_date: str = Field(default="", description="Comment publish date")
    first_reply_to_comment: str = Field(
        default="", description="First reply to the comment"
    )


class AuthorProfileModel(BaseModel):
    author_name: str = Field(default="", description="Author name")
    location: str = Field(default="未知", description="IP location of the user")
    author_avatar_url: str = Field(default="", description="Author avatar url")
    introduction: str = Field(default="", description="Introduction of the user")
    related_topics: list[str] = Field(
        default_factory=list, description="Related topics of the user, at most 3"
    )
    interests: list[str] = Field(
        default_factory=list, description="Interests of the user, at most 3"
    )
    careers: list[str] = Field(
        default_factory=list, description="Inferred career of the user"
    )


class RedNoteDBSchema(BaseModel):
    id: str = Field(description="Unique note identifier")
    url: Optional[str] = Field(default=None, description="URL of the note")
    html: Optional[str] = Field(default=None, description="HTML content of the note")
    note_content: RedNoteSchema = Field(description="Note content")
    user_profile: RedNoteUserProfileSchema = Field(description="User profile")
    image_assets: list[str] = Field(
        default_factory=list, description="Asset UUIDs for images"
    )
    image_base64: list[str] = Field(
        default_factory=list,
        description="Image base64 list - TODO: Remove in future refactor - keeping for backward compatibility",
    )
    token_usage: int = Field(description="Token usage")
    created_at: datetime = Field(description="Creation timestamp")
    processing_time_seconds: int = Field(description="Processing time in seconds")


if __name__ == "__main__":
    import uuid
    from datetime import datetime

    task_data = {
        "id": str(uuid.uuid4()),
        "project_id": "test-project",
        "url": "https://xiaohongshu.com/item/123",
        "html": None,
        "status": "pending",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "error_msg": None,
    }

    task = TaskSchema(**task_data)
    print(f"✓ TaskSchema validation passed: {task.id}")

    project_data = {
        "id": "test-project",
        "name": "Test Project",
        "created_at": datetime.now(),
    }

    project = ProjectSchema(**project_data)
    print(f"✓ ProjectSchema validation passed: {project.name}")

    request_data = {
        "project_id": "test-project",
        "url": "https://xiaohongshu.com/item/123",
    }

    request = TaskCreateRequest(**request_data)
    print(f"✓ TaskCreateRequest validation passed: {request.project_id}")

    response = TaskResponse(**task_data)
    print(f"✓ TaskResponse validation passed: {response.status}")

    stats_data = {
        "total_tasks": 100,
        "pending_tasks": 10,
        "processing_tasks": 2,
        "failed_tasks": 3,
        "successful_tasks": 85,
        "token_usage": 50000,
        "estimated_cost": 2.50,
        "processing_time_seconds": 1800,
    }

    stats = ProjectStatsResponse(**stats_data)
    print(f"✓ ProjectStatsResponse validation passed: {stats.total_tasks} tasks")

    db_task_data = {
        "id": str(uuid.uuid4()),
        "url": "https://xiaohongshu.com/item/123",
        "html": None,
        "note_content": {
            "title": "Test Note",
            "content": "Test content",
            "tags": ["test"],
            "date": "2024-01-01",
            "like_count": 100,
            "comment_count": 5,
            "favorite_count": 20,
            "location": "北京",
            "image_urls": ["https://example.com/image1.jpg"],
            "video_urls": [],
            "author_name": "Test Author",
            "author_avatar_url": "https://example.com/avatar.jpg",
            "author_profile_url": "https://example.com/profile",
            "comments": [],
        },
        "user_profile": {
            "location": "北京",
            "author_name": "Test Author",
            "author_avatar_url": "https://example.com/avatar.jpg",
            "introduction": "Test user",
            "related_topics": ["AI", "Tech"],
            "interests": ["Programming"],
            "career": "Engineer",
        },
        "image_assets": ["uuid-123", "uuid-456"],
        "image_base64": ["base64encodedimage"],
        "token_usage": 1000,
        "created_at": datetime.now(),
        "processing_time_seconds": 30,
    }

    db_task = RedNoteDBSchema(**db_task_data)
    print(f"✓ RedNoteDBSchema validation passed: {db_task.note_content.title}")

    print("All schema validations completed successfully!")
