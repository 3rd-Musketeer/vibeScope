import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

from db import save_successful_task
from data_processor import process_task_to_database

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
    
    
    async def process_task(self, task_id: str) -> None:
        task = self.tasks.get(task_id)
        if not task or task["status"] != "pending":
            return
        
        task["status"] = "processing"
        task["updated_at"] = datetime.now()
        
        try:
            clean_record = await process_task_to_database(task)
            save_successful_task(clean_record)
            
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