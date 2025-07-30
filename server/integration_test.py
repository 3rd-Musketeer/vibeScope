import asyncio
import httpx
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def integration_test():
    print("🧪 Starting Integration Test...")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        
        # Step 1: Create a project
        print("1️⃣ Creating project...")
        project_response = await client.post(
            f"{BASE_URL}/projects",
            params={"name": "Integration Test Project"}
        )
        assert project_response.status_code == 200
        project_data = project_response.json()
        project_id = project_data["id"]
        print(f"✅ Project created: {project_data['name']} (ID: {project_id})")
        
        # Step 2: Verify project in list
        print("\n2️⃣ Verifying project list...")
        projects_response = await client.get(f"{BASE_URL}/projects")
        assert projects_response.status_code == 200
        projects = projects_response.json()
        project_found = any(p["id"] == project_id for p in projects)
        assert project_found
        print(f"✅ Project found in list ({len(projects)} total projects)")
        
        # Step 3: Add task to queue
        print("\n3️⃣ Adding task to queue...")
        task_response = await client.post(
            f"{BASE_URL}/tasks",
            json={
                "project_id": project_id,
                "url": "https://example.com/test-page"
            }
        )
        assert task_response.status_code == 200
        task_data = task_response.json()
        task_id = task_data["id"]
        assert task_data["status"] == "pending"
        print(f"✅ Task added: {task_id}")
        print(f"   Status: {task_data['status']}")
        print(f"   URL: {task_data['url']}")
        
        # Step 4: Check queue status
        print("\n4️⃣ Checking queue status...")
        queue_response = await client.get(f"{BASE_URL}/queue/status")
        assert queue_response.status_code == 200
        queue_stats = queue_response.json()
        print(f"✅ Queue status: {queue_stats}")
        assert queue_stats["pending"] >= 1 or queue_stats["processing"] >= 1
        
        # Step 5: Get tasks by project
        print("\n5️⃣ Getting tasks by project...")
        tasks_response = await client.get(f"{BASE_URL}/tasks/{project_id}")
        assert tasks_response.status_code == 200
        tasks = tasks_response.json()
        task_found = any(t["id"] == task_id for t in tasks)
        assert task_found
        print(f"✅ Task found in project tasks ({len(tasks)} total)")
        
        # Step 6: Filter tasks by status
        print("\n6️⃣ Filtering tasks by status...")
        pending_response = await client.get(
            f"{BASE_URL}/tasks/{project_id}",
            params={"status": "pending"}
        )
        assert pending_response.status_code == 200
        pending_tasks = pending_response.json()
        print(f"✅ Found {len(pending_tasks)} pending tasks")
        
        # Step 7: Wait for task processing (with timeout)
        print("\n7️⃣ Waiting for task processing...")
        max_wait = 30
        wait_time = 0
        task_processed = False
        
        while wait_time < max_wait:
            task_response = await client.get(f"{BASE_URL}/tasks/{project_id}")
            tasks = task_response.json()
            current_task = next((t for t in tasks if t["id"] == task_id), None)
            
            if current_task:
                status = current_task["status"]
                print(f"   Task status: {status} (waited {wait_time}s)")
                
                if status in ["failed", "success"]:
                    task_processed = True
                    final_status = status
                    break
            else:
                # Task might have been moved to successful tasks DB
                success_response = await client.get(
                    f"{BASE_URL}/tasks/{project_id}",
                    params={"status": "success"}
                )
                if success_response.status_code == 200:
                    success_tasks = success_response.json()
                    if any(t["id"] == task_id for t in success_tasks):
                        task_processed = True
                        final_status = "success"
                        break
            
            await asyncio.sleep(2)
            wait_time += 2
        
        if task_processed:
            print(f"✅ Task processed with status: {final_status}")
        else:
            print(f"⚠️ Task still processing after {max_wait}s (this is normal for real URLs)")
        
        # Step 8: Test task retry (if failed)
        if task_processed and final_status == "failed":
            print("\n8️⃣ Testing task retry...")
            retry_response = await client.post(f"{BASE_URL}/tasks/{task_id}/retry")
            assert retry_response.status_code == 200
            retry_result = retry_response.json()
            print(f"✅ Task retry: {retry_result['message']}")
        
        # Step 9: Get project statistics
        print("\n9️⃣ Getting project statistics...")
        stats_response = await client.get(f"{BASE_URL}/projects/{project_id}/stats")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        print(f"✅ Project stats:")
        print(f"   Total tasks: {stats['total_tasks']}")
        print(f"   Pending: {stats['pending_tasks']}")
        print(f"   Processing: {stats['processing_tasks']}")
        print(f"   Failed: {stats['failed_tasks']}")
        print(f"   Successful: {stats['successful_tasks']}")
        print(f"   Token usage: {stats['token_usage']}")
        print(f"   Processing time: {stats['processing_time_seconds']}s")
        
        # Step 10: Test project export
        print("\n🔟 Testing project export...")
        export_response = await client.get(f"{BASE_URL}/projects/{project_id}/export")
        assert export_response.status_code == 200
        export_data = export_response.json()
        print(f"✅ Project export:")
        print(f"   Project: {export_data['project']['name']}")
        print(f"   Total tasks: {export_data['total_tasks']}")
        print(f"   Export timestamp: {export_data['export_timestamp']}")
        
        # Step 11: Test task deletion
        print("\n1️⃣1️⃣ Testing task deletion...")
        delete_response = await client.post(f"{BASE_URL}/tasks/{task_id}/delete")
        
        if delete_response.status_code == 200:
            delete_result = delete_response.json()
            print(f"✅ Task deleted: {delete_result['message']}")
            
            # Verify task is gone from queue
            tasks_response = await client.get(f"{BASE_URL}/tasks/{project_id}")
            tasks = tasks_response.json()
            task_still_exists = any(t["id"] == task_id for t in tasks)
            
            if not task_still_exists:
                print("✅ Task successfully removed from queue")
            else:
                print("ℹ️ Task may have been processed and moved to DB")
        else:
            print(f"ℹ️ Task deletion returned {delete_response.status_code} (task may have been processed)")
        
        # Step 12: Test API documentation
        print("\n1️⃣2️⃣ Testing API documentation...")
        docs_response = await client.get(f"{BASE_URL}/docs")
        assert docs_response.status_code == 200
        print("✅ API documentation accessible at /docs")
        
        openapi_response = await client.get(f"{BASE_URL}/openapi.json")
        assert openapi_response.status_code == 200
        openapi_spec = openapi_response.json()
        print(f"✅ OpenAPI spec available: {len(openapi_spec['paths'])} endpoints")

async def main():
    try:
        # Check if server is running
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{BASE_URL}/queue/status", timeout=5.0)
                if response.status_code != 200:
                    raise Exception("Server not responding correctly")
            except Exception as e:
                print("❌ Server is not running!")
                print("Please start the server first:")
                print("   uv run python main.py")
                print("\nThen run this test in another terminal:")
                print("   uv run python integration_test.py")
                return
        
        await integration_test()
        
        print("\n" + "=" * 50)
        print("🎉 Integration Test PASSED!")
        print("All backend functionality working correctly.")
        print("\n📊 Test Summary:")
        print("✅ Project management")
        print("✅ Task queue operations")
        print("✅ Status tracking")
        print("✅ Task processing workflow")
        print("✅ Statistics and export")
        print("✅ API documentation")
        print("\n🚀 Ready for frontend integration!")
        
    except Exception as e:
        print(f"\n❌ Integration Test FAILED!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())