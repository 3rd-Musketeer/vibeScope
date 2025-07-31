from tinydb import TinyDB, Query
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import os
from api_schema import ProjectSchema
from data_schema import DBSchema

def init_db() -> None:
    os.makedirs('data', exist_ok=True)
    projects_db = TinyDB('data/projects.json')
    successful_tasks_db = TinyDB('data/crawled_data.json')
    projects_db.close()
    successful_tasks_db.close()

def save_project(project: Dict[str, Any]) -> None:
    if not project.get("id"):
        raise ValueError("project id is required")
    
    db = TinyDB('data/projects.json')
    Project = Query()
    
    existing = db.search(Project.id == project["id"])
    if existing:
        db.update(project, Project.id == project["id"])
    else:
        db.insert(project)
    
    db.close()

def get_projects() -> List[Dict[str, Any]]:
    db = TinyDB('data/projects.json')
    projects = db.all()
    db.close()
    return projects

def save_successful_task(task_data) -> None:
    """Save successful task with DBSchema validation"""
    
    # Handle both dict and DBSchema input
    if isinstance(task_data, DBSchema):
        db_record = task_data
        # Convert DBSchema to dict for TinyDB storage
        task_dict = db_record.model_dump(mode='json')
        # Convert datetime to ISO string for JSON serialization
        if isinstance(task_dict.get('created_at'), datetime):
            task_dict['created_at'] = task_dict['created_at'].isoformat()
        elif hasattr(task_dict.get('created_at'), 'isoformat'):
            task_dict['created_at'] = task_dict['created_at'].isoformat()
    else:
        # Legacy dict format - validate with DBSchema
        try:
            db_record = DBSchema(**task_data)
            task_dict = task_data
        except Exception as e:
            raise ValueError(f"task data does not match DBSchema: {e}")
    
    if not task_dict.get("id"):
        raise ValueError("task id is required")
    
    db = TinyDB('data/crawled_data.json')
    db.insert(task_dict)
    db.close()

def get_successful_tasks_by_project(project_id: str) -> List[Dict[str, Any]]:
    if not project_id:
        raise ValueError("project_id is required")
    
    db = TinyDB('data/crawled_data.json')
    Task = Query()
    tasks = db.search(Task.project_id == project_id)
    db.close()
    return tasks

def get_project_stats(project_id: str) -> Dict[str, Any]:
    if not project_id:
        raise ValueError("project_id is required")
    
    successful_tasks = get_successful_tasks_by_project(project_id)
    
    total_token_usage = 0
    total_processing_time = 0
    
    for task in successful_tasks:
        if task.get("token_usage"):
            total_token_usage += task["token_usage"]
        if task.get("processing_time_seconds"):
            total_processing_time += task["processing_time_seconds"]
    
    return {
        "successful_tasks": len(successful_tasks),
        "token_usage": total_token_usage,
        "processing_time_seconds": total_processing_time
    }

def export_project_data(project_id: str) -> Dict[str, Any]:
    if not project_id:
        raise ValueError("project_id is required")
    
    project_db = TinyDB('data/projects.json')
    Project = Query()
    project = project_db.search(Project.id == project_id)
    project_db.close()
    
    if not project:
        raise ValueError(f"project {project_id} not found")
    
    successful_tasks = get_successful_tasks_by_project(project_id)
    
    return {
        "project": project[0],
        "successful_tasks": successful_tasks,
        "export_timestamp": datetime.now().isoformat(),
        "total_tasks": len(successful_tasks)
    }

def delete_project_data(project_id: str) -> None:
    if not project_id:
        raise ValueError("project_id is required")
    
    project_db = TinyDB('data/projects.json')
    Project = Query()
    project = project_db.search(Project.id == project_id)
    
    if not project:
        project_db.close()
        raise ValueError(f"project {project_id} not found")
    
    project_db.remove(Project.id == project_id)
    project_db.close()
    
    tasks_db = TinyDB('data/crawled_data.json')
    Task = Query()
    tasks_db.remove(Task.project_id == project_id)
    tasks_db.close()

if __name__ == "__main__":
    from datetime import datetime
    import uuid
    import os
    
    if os.path.exists('data/projects.json'):
        os.remove('data/projects.json')
    if os.path.exists('data/crawled_data.json'):
        os.remove('data/crawled_data.json')
    
    print("Testing database operations...")
    
    init_db()
    print("✓ Database initialization completed")
    
    test_project = {
        "id": "test-project-123",
        "name": "Test Project",
        "created_at": datetime.now().isoformat()
    }
    
    save_project(test_project)
    print("✓ Project saved successfully")
    
    projects = get_projects()
    assert len(projects) == 1
    assert projects[0]["id"] == "test-project-123"
    print("✓ Project retrieval verified")
    
    from data_schema import BaseContentModel, LinksModel, MetadataModel, CommentsModel, AuthorProfileModel
    
    test_task = DBSchema(
        id=str(uuid.uuid4()),
        project_id="test-project-123",
        url="https://xiaohongshu.com/item/123",
        html=None,
        base_content=BaseContentModel(
            title="Test Note",
            content="Test content",
            author_name="Test Author",
            publish_date="2024-01-01"
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
            location="北京",
            author_avatar_url="https://example.com/avatar.jpg",
            introduction="Test user",
            related_topics=["AI", "Tech"],
            interests=["Programming"],
            careers=["Engineer"]
        ),
        image_assets=["asset-uuid-123"],
        token_usage=1000,
        created_at=datetime.now(),
        processing_time_seconds=30
    )
    
    save_successful_task(test_task)
    print("✓ Successful task saved")
    
    tasks = get_successful_tasks_by_project("test-project-123")
    print(f"Found {len(tasks)} tasks")
    if len(tasks) == 0:
        print("WARNING: No tasks found - project_id mismatch")
    else:
        assert tasks[0]["id"] == test_task.id
        print("✓ Task retrieval verified")
    
    stats = get_project_stats("test-project-123")
    assert stats["successful_tasks"] == 1
    assert stats["token_usage"] == 1000
    assert stats["processing_time_seconds"] == 30
    print("✓ Project statistics calculated")
    
    export_data = export_project_data("test-project-123")
    assert export_data["project"]["id"] == "test-project-123"
    assert len(export_data["successful_tasks"]) == 1
    print("✓ Project export completed")
    
    delete_project_data("test-project-123")
    print("✓ Project deletion completed")
    
    remaining_projects = get_projects()
    assert len(remaining_projects) == 0
    print("✓ Project deletion verified")
    
    remaining_tasks = get_successful_tasks_by_project("test-project-123")
    assert len(remaining_tasks) == 0
    print("✓ Task cleanup verified")
    
    os.remove('data/projects.json')
    os.remove('data/crawled_data.json')
    
    print("All database operations validated successfully!")