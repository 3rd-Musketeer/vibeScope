import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import httpx
import base64
from db import save_successful_task
from extractor import extract_note_content, extract_user_profile

class TaskQueue:
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.semaphore = asyncio.Semaphore(2)
        self.dispatcher_running = False
    
    def add_task(self, task: Dict[str, Any]) -> None:
        if not task.get("id"):
            raise ValueError("task id is required")
        if not task.get("project_id"):
            raise ValueError("project_id is required")
        if not task.get("url") and not task.get("html"):
            raise ValueError("either url or html is required")
        
        # New validation for extension mode: if html is provided, url should also be provided for base URL extraction
        if task.get("html") and not task.get("url"):
            raise ValueError("url is required when html is provided for base URL extraction")
        
        task["status"] = "pending"
        task["created_at"] = datetime.now()
        task["updated_at"] = datetime.now()
        task["error_msg"] = None
        
        self.tasks[task["id"]] = task
    
    def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        if not task_id:
            raise ValueError("task_id is required")
        
        return self.tasks.get(task_id)
    
    def delete_task(self, task_id: str) -> None:
        if not task_id:
            raise ValueError("task_id is required")
        
        if task_id not in self.tasks:
            raise ValueError(f"task {task_id} not found")
        
        del self.tasks[task_id]
    
    def get_tasks_by_status(self, status: str) -> List[Dict[str, Any]]:
        if not status:
            raise ValueError("status is required")
        
        return [task for task in self.tasks.values() if task["status"] == status]
    
    def retry_task(self, task_id: str) -> None:
        if not task_id:
            raise ValueError("task_id is required")
        
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"task {task_id} not found")
        
        if task["status"] != "failed":
            raise ValueError(f"task {task_id} is not failed, cannot retry")
        
        task["status"] = "pending"
        task["updated_at"] = datetime.now()
        task["error_msg"] = None
    
    def get_queue_stats(self) -> Dict[str, int]:
        stats = {"pending": 0, "processing": 0, "failed": 0}
        
        for task in self.tasks.values():
            status = task["status"]
            if status in stats:
                stats[status] += 1
        
        return stats
    
    async def start_dispatcher(self) -> None:
        if self.dispatcher_running:
            return
        
        self.dispatcher_running = True
        
        while self.dispatcher_running:
            pending_tasks = self.get_tasks_by_status("pending")
            
            for task in pending_tasks:
                if not self.dispatcher_running:
                    break
                
                async with self.semaphore:
                    if task["status"] == "pending":
                        asyncio.create_task(self.process_task(task["id"]))
            
            await asyncio.sleep(1)
    
    async def fetch_image_as_data_url(self, image_url: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                if response.status_code == 200:
                    image_data = response.content
                    base64_data = base64.b64encode(image_data).decode('utf-8')
                    
                    content_type = response.headers.get('content-type', '')
                    if 'image/' in content_type:
                        mime_type = content_type
                    elif image_url.lower().endswith(('.png', '.PNG')):
                        mime_type = 'image/png'
                    elif image_url.lower().endswith(('.gif', '.GIF')):
                        mime_type = 'image/gif'
                    elif image_url.lower().endswith(('.webp', '.WEBP')):
                        mime_type = 'image/webp'
                    else:
                        mime_type = 'image/jpeg'
                    
                    return f"data:{mime_type};base64,{base64_data}"
                else:
                    return ""
        except Exception as e:
            return ""
    
    async def process_task(self, task_id: str) -> None:
        task = self.tasks.get(task_id)
        if not task or task["status"] != "pending":
            return
        
        task["status"] = "processing"
        task["updated_at"] = datetime.now()
        
        start_time = datetime.now()
        
        try:
            note_content = await extract_note_content(
                note_url=task.get("url"),
                note_html=task.get("html")
            )
            
            # Clean up count fields to ensure they are integers
            if note_content.get("like_count") is None:
                note_content["like_count"] = 0
            if note_content.get("comment_count") is None:
                note_content["comment_count"] = 0
            if note_content.get("favorite_count") is None:
                note_content["favorite_count"] = 0
            
            user_profile = None
            if note_content.get("author_profile_url"):
                try:
                    user_profile = await extract_user_profile(
                        user_url=note_content["author_profile_url"]
                    )
                except Exception:
                    user_profile = {
                        "location": "未知",
                        "author_name": note_content.get("author_name", "未知"),
                        "author_avatar_url": note_content.get("author_avatar_url", ""),
                        "introduction": "未知",
                        "related_topics": [],
                        "interests": [],
                        "career": "未知"
                    }
            else:
                user_profile = {
                    "location": "未知",
                    "author_name": note_content.get("author_name", "未知"),
                    "author_avatar_url": note_content.get("author_avatar_url", ""),
                    "introduction": "未知",
                    "related_topics": [],
                    "interests": [],
                    "career": "未知"
                }
            
            image_base64_list = []
            if note_content.get("image_urls"):
                for image_url in note_content["image_urls"]:
                    data_url = await self.fetch_image_as_data_url(image_url)
                    if data_url:
                        image_base64_list.append(data_url)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            successful_task = {
                "id": task["id"],
                "project_id": task["project_id"],
                "url": task.get("url"),
                "html": task.get("html"),
                "note_content": note_content,
                "user_profile": user_profile,
                "image_base64": image_base64_list,
                "token_usage": 0,
                "created_at": datetime.now().isoformat(),
                "processing_time_seconds": int(processing_time)
            }
            
            save_successful_task(successful_task)
            
            del self.tasks[task_id]
            
        except Exception as e:
            task["status"] = "failed"
            task["error_msg"] = str(e)
            task["updated_at"] = datetime.now()

if __name__ == "__main__":
    import asyncio
    import os
    
    if os.path.exists('projects.json'):
        os.remove('projects.json')
    if os.path.exists('successful_tasks.json'):
        os.remove('successful_tasks.json')
    
    async def test_task_queue():
        print("Testing TaskQueue operations...")
        
        queue = TaskQueue()
        
        test_task = {
            "id": str(uuid.uuid4()),
            "project_id": "test-project",
            "url": "https://example.com",
            "html": None
        }
        
        queue.add_task(test_task)
        print("✓ Task added to queue")
        
        retrieved_task = queue.get_task_by_id(test_task["id"])
        assert retrieved_task is not None
        assert retrieved_task["status"] == "pending"
        print("✓ Task retrieval verified")
        
        pending_tasks = queue.get_tasks_by_status("pending")
        assert len(pending_tasks) == 1
        print("✓ Status filtering verified")
        
        stats = queue.get_queue_stats()
        assert stats["pending"] == 1
        assert stats["processing"] == 0
        assert stats["failed"] == 0
        print("✓ Queue statistics calculated")
        
        test_task["status"] = "failed"
        test_task["error_msg"] = "Test error"
        queue.retry_task(test_task["id"])
        assert queue.get_task_by_id(test_task["id"])["status"] == "pending"
        print("✓ Task retry functionality verified")
        
        queue.delete_task(test_task["id"])
        assert queue.get_task_by_id(test_task["id"]) is None
        print("✓ Task deletion verified")
        
        print("All TaskQueue operations validated successfully!")
    
    asyncio.run(test_task_queue())