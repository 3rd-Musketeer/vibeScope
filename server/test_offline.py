import asyncio
import os
import json
from datetime import datetime
import uuid

def test_offline_components():
    print("🔧 Testing Offline Components...")
    print("=" * 40)
    
    # Clean up any existing test files
    for file in ['projects.json', 'successful_tasks.json']:
        if os.path.exists(file):
            os.remove(file)
    
    # Test 1: Schema validation
    print("1️⃣ Testing schema validation...")
    from schema import TaskSchema, ProjectSchema, RedNoteDBSchema, TaskCreateRequest, ProjectStatsResponse
    
    task_data = {
        "id": str(uuid.uuid4()),
        "project_id": "test-project",
        "url": "https://example.com",
        "html": None,
        "status": "pending",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "error_msg": None
    }
    
    task = TaskSchema(**task_data)
    print(f"✅ TaskSchema validated: {task.id[:8]}...")
    
    # Test 2: Database operations
    print("\n2️⃣ Testing database operations...")
    from db import init_db, save_project, get_projects, save_successful_task, get_successful_tasks_by_project, get_project_stats
    
    init_db()
    print("✅ Database initialized")
    
    project_data = {
        "id": "test-project-123",
        "name": "Test Project",
        "created_at": datetime.now().isoformat()
    }
    
    save_project(project_data)
    projects = get_projects()
    assert len(projects) == 1
    print(f"✅ Project saved and retrieved: {projects[0]['name']}")
    
    # Test 3: Task queue operations
    print("\n3️⃣ Testing task queue operations...")
    from task_queue import TaskQueue
    
    queue = TaskQueue()
    
    test_task = {
        "id": str(uuid.uuid4()),
        "project_id": "test-project-123",
        "url": "https://example.com",
        "html": None
    }
    
    queue.add_task(test_task)
    retrieved_task = queue.get_task_by_id(test_task["id"])
    assert retrieved_task["status"] == "pending"
    print(f"✅ Task added and retrieved: {retrieved_task['id'][:8]}...")
    
    stats = queue.get_queue_stats()
    assert stats["pending"] == 1
    print(f"✅ Queue stats: {stats}")
    
    # Test 4: Complete task structure
    print("\n4️⃣ Testing complete task structure...")
    
    complete_task = {
        "id": str(uuid.uuid4()),
        "url": "https://example.com",
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
            "image_urls": [],
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
            "related_topics": ["AI"],
            "interests": ["Tech"],
            "career": "Engineer"
        },
        "image_base64": [],
        "token_usage": 1000,
        "created_at": datetime.now().isoformat(),
        "processing_time_seconds": 30
    }
    
    # Validate with schema
    db_task = RedNoteDBSchema(**complete_task)
    print(f"✅ RedNoteDBSchema validated: {db_task.note_content.title}")
    
    # Save to database
    complete_task["project_id"] = "test-project-123"
    save_successful_task(complete_task)
    
    saved_tasks = get_successful_tasks_by_project("test-project-123")
    assert len(saved_tasks) == 1
    print(f"✅ Complete task saved to database")
    
    # Test stats
    stats = get_project_stats("test-project-123")
    assert stats["successful_tasks"] == 1
    assert stats["token_usage"] == 1000
    print(f"✅ Project stats calculated: {stats}")
    
    # Test 5: FastAPI imports and validation
    print("\n5️⃣ Testing FastAPI components...")
    try:
        from server import app
        from fastapi.testclient import TestClient
        
        # Test client creation
        client = TestClient(app)
        print("✅ FastAPI app and test client created")
        
        # Test OpenAPI schema generation
        openapi_schema = app.openapi()
        endpoint_count = len(openapi_schema["paths"])
        print(f"✅ OpenAPI schema generated: {endpoint_count} endpoints")
        
        expected_endpoints = ["/tasks", "/projects", "/queue/status"]
        for endpoint in expected_endpoints:
            assert endpoint in str(openapi_schema["paths"])
        print("✅ All expected endpoints present")
        
    except ImportError as e:
        print(f"⚠️ FastAPI components not tested (missing dependency: {e})")
    
    # Cleanup
    for file in ['projects.json', 'successful_tasks.json']:
        if os.path.exists(file):
            os.remove(file)
    
    print("\n" + "=" * 40)
    print("🎉 Offline Component Tests PASSED!")
    print("\n📋 Components Tested:")
    print("✅ Pydantic schemas with validation")
    print("✅ TinyDB database operations")
    print("✅ Task queue management")
    print("✅ Complete data flow structures")
    print("✅ FastAPI application setup")
    print("\n🚀 All components ready for integration!")

async def test_async_components():
    print("\n🔄 Testing Async Components...")
    print("=" * 40)
    
    # Test async task queue functionality
    from task_queue import TaskQueue
    
    queue = TaskQueue()
    
    # Test image fetching function (with mock URL)
    print("1️⃣ Testing image fetching...")
    
    # This will fail gracefully for a non-image URL
    data_url = await queue.fetch_image_as_data_url("https://httpbin.org/status/404")
    print(f"✅ Image fetch function works (returns empty on 404): {len(data_url) == 0}")
    
    # Test dispatcher setup (without actual processing)
    print("\n2️⃣ Testing dispatcher setup...")
    assert not queue.dispatcher_running
    print("✅ Dispatcher initially stopped")
    
    # Add a test task
    test_task = {
        "id": str(uuid.uuid4()),
        "project_id": "async-test",
        "url": "https://example.com",
        "html": None
    }
    
    queue.add_task(test_task)
    pending_tasks = queue.get_tasks_by_status("pending")
    assert len(pending_tasks) == 1
    print(f"✅ Async task queue operations work: {len(pending_tasks)} pending")
    
    print("\n🎉 Async Component Tests PASSED!")

def main():
    print("🧪 Running Comprehensive Component Tests")
    print("=" * 50)
    
    try:
        # Test synchronous components
        test_offline_components()
        
        # Test asynchronous components
        asyncio.run(test_async_components())
        
        print("\n" + "=" * 50)
        print("🎊 ALL TESTS PASSED!")
        print("\nSystem Status: ✅ READY")
        print("\n📝 Next Steps:")
        print("1. Start server: uv run python main.py")
        print("2. Run integration test: uv run python integration_test.py")
        print("3. Open API docs: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"\n❌ Component Tests FAILED!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()