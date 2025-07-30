from tinydb import TinyDB, Query
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
from schema import ProjectSchema, RedNoteDBSchema

def init_db() -> None:
    projects_db = TinyDB('projects.json')
    successful_tasks_db = TinyDB('successful_tasks.json')
    projects_db.close()
    successful_tasks_db.close()

def save_project(project: Dict[str, Any]) -> None:
    if not project.get("id"):
        raise ValueError("project id is required")
    
    db = TinyDB('projects.json')
    Project = Query()
    
    existing = db.search(Project.id == project["id"])
    if existing:
        db.update(project, Project.id == project["id"])
    else:
        db.insert(project)
    
    db.close()

def get_projects() -> List[Dict[str, Any]]:
    db = TinyDB('projects.json')
    projects = db.all()
    db.close()
    return projects

def save_successful_task(task: Dict[str, Any]) -> None:
    if not task.get("id"):
        raise ValueError("task id is required")
    if not task.get("note_content"):
        raise ValueError("note_content is required for successful tasks")
    if not task.get("user_profile"):
        raise ValueError("user_profile is required for successful tasks")
    
    try:
        RedNoteDBSchema(**task)
    except Exception as e:
        raise ValueError(f"task data does not match RedNoteDBSchema: {e}")
    
    db = TinyDB('successful_tasks.json')
    db.insert(task)
    db.close()

def get_successful_tasks_by_project(project_id: str) -> List[Dict[str, Any]]:
    if not project_id:
        raise ValueError("project_id is required")
    
    db = TinyDB('successful_tasks.json')
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
    
    project_db = TinyDB('projects.json')
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

if __name__ == "__main__":
    from datetime import datetime
    import uuid
    import os
    
    if os.path.exists('projects.json'):
        os.remove('projects.json')
    if os.path.exists('successful_tasks.json'):
        os.remove('successful_tasks.json')
    
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
    
    test_task = {
        "id": str(uuid.uuid4()),
        "url": "https://xiaohongshu.com/item/123",
        "html": None,
        "project_id": "test-project-123",
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
            "comments": []
        },
        "user_profile": {
            "location": "北京",
            "author_name": "Test Author",
            "author_avatar_url": "https://example.com/avatar.jpg",
            "introduction": "Test user",
            "related_topics": ["AI", "Tech"],
            "interests": ["Programming"],
            "career": "Engineer"
        },
        "image_base64": ["base64encodedimage"],
        "token_usage": 1000,
        "created_at": datetime.now().isoformat(),
        "processing_time_seconds": 30
    }
    
    save_successful_task(test_task)
    print("✓ Successful task saved")
    
    tasks = get_successful_tasks_by_project("test-project-123")
    print(f"Found {len(tasks)} tasks")
    if len(tasks) == 0:
        print("WARNING: No tasks found - project_id mismatch")
    else:
        assert tasks[0]["id"] == test_task["id"]
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
    
    os.remove('projects.json')
    os.remove('successful_tasks.json')
    
    print("All database operations validated successfully!")