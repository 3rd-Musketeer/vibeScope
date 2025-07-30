# Backend Implementation Plan - MVP

## File Structure

```
server/
├── server.py          # FastAPI application + endpoints
├── task_queue.py      # In-memory task queue management
├── db.py             # TinyDB persistence for completed tasks
├── schema.py         # Pydantic schemas (extend existing)
├── extractor.py      # Existing extraction logic
└── main.py           # Server entry point
```

## Implementation Order

### 1. Schema Extensions (`schema.py`)
**Add these schemas:**
- `TaskSchema` - Task data structure (id, project_id, url, html, status, timestamps, error_msg) (url and html should both exist, cuase url is important meta data)
- `ProjectSchema` - Project metadata (id, name, created_at)  
- `TaskCreateRequest` - API request for adding tasks
- `TaskResponse` - API response format
- `ProjectStatsResponse` - Project statistics (excludes estimated_cost for MVP)
- `RedNoteDBSchema` - Database structure for successful tasks (note_content, user_profile, image_base64)

### 2. Database Layer (`db.py`)
**Functions:**
- `init_db()` - Initialize TinyDB files (projects.json, successful_tasks.json)
- `save_successful_task(task)` - Save only successful task with RedNoteDBSchema structure, validates schema before insertion
- `get_successful_tasks_by_project(project_id)` - Retrieve successful tasks from DB
- `save_project(project)` - Create/update project
- `get_projects()` - List all projects
- `get_project_stats(project_id)` - Statistics (counts, tokens, processing time - excludes costs for MVP)
- `export_project_data(project_id)` - Export successful tasks as JSON

### 3. Task Queue (`task_queue.py`)
**TaskQueue Class:**
- `tasks: dict` - All active tasks {task_id: task} (pending, processing, failed)
- `semaphore: asyncio.Semaphore(2)` - Limit concurrent processing
- Use task status filtering to get pending/processing/failed tasks

**Methods:**
- `add_task(task)` - Add task with status='pending'
- `get_tasks_by_status(status)` - Filter tasks by status
- `get_task_by_id(task_id)` - Get specific task
- `delete_task(task_id)` - Remove task from queue
- `retry_task(task_id)` - Change failed task status to pending
- `get_queue_stats()` - Current queue counts by status

**Background Dispatcher:**
- `start_dispatcher()` - Start background processing loop
- `process_task(task)` - Run note extraction + user profile extraction, fetch images as data URLs using httpx, save successful results to DB with RedNoteDBSchema structure, update task status
- `fetch_image_as_data_url(image_url)` - Fetch images and convert to data URL format (data:image/jpeg;base64,...)
- Failed tasks remain in queue with error_msg

### 4. FastAPI Server (`server.py`)
**Endpoints:**

**Task Management:**
- `POST /tasks` - Add new task to queue (status='pending')
- `GET /tasks/{project_id}` - Get tasks by project from queue + successful tasks from DB (query param: status filter)
- `POST /tasks/{task_id}/retry` - Retry failed task (failed → pending)
- `POST /tasks/{task_id}/delete` - Delete task from queue

**Project Management:**
- `GET /projects` - List all projects  
- `POST /projects` - Create new project
- `GET /projects/{project_id}/stats` - Project statistics
- `GET /projects/{project_id}/export` - Export project data

**Queue Status:**
- `GET /queue/status` - Real-time queue status (pending/processing/failed counts from queue)

### 5. Server Entry Point (`main.py`)
**Functions:**
- Environment validation
- Start FastAPI with uvicorn
- Initialize task queue dispatcher

## Key Implementation Details

### Task Flow
1. User submits URL/HTML via POST /tasks
2. Generate task_id, add to queue with status='pending'
3. Background dispatcher picks up pending task (max 2 concurrent via semaphore)
4. Update task status to 'processing'
5. Run note extraction + user profile extraction using existing extractor.py
6. Fetch all images from image_urls and convert to data URL format using httpx
7. If success: save complete RedNoteDBSchema structure to DB, remove task from queue  
8. If failed: update task status to 'failed', keep in queue with error_msg

### Error Handling
- Catch extraction failures, save error message to task dict in queue
- Failed tasks remain in queue for user to retry or delete
- Support retry mechanism (failed → pending)

### Data Storage
**Queue (Memory):**
- Tasks dict: {task_id: task} with status (pending/processing/failed)
- Task schema: id, project_id, url, html, status, error_msg, timestamps

**Database (TinyDB):**
- `projects.json`: Project metadata (id, name, created_at)
- `successful_tasks.json`: Only successful extractions with full content (matches RedNoteDBSchema - includes note_content, user_profile, image_base64)

## Fine-Grained Development Todo List

### Schema Layer (3 tasks)
1. **Add TaskSchema base class** - Common fields (id, project_id, url, html, status, timestamps, error_msg)
2. **Add ProjectSchema** - Fields (id, name, created_at) 
3. **Add API request/response models** - TaskCreateRequest, TaskResponse, ProjectStatsResponse

### Database Layer (4 tasks)
4. **Create db.py with init_db()** - Creates projects.json and successful_tasks.json TinyDB files
5. **Implement project operations** - save_project() and get_projects() functions
6. **Implement task operations** - save_successful_task() and get_successful_tasks_by_project() functions  
7. **Implement stats/export** - get_project_stats() and export_project_data() functions

### Task Queue Layer (5 tasks)
8. **Create TaskQueue class** - Initialize with tasks dict and semaphore(2)
9. **Implement basic operations** - add_task(), get_task_by_id(), delete_task() methods
10. **Implement status operations** - get_tasks_by_status(), retry_task(), get_queue_stats() methods
11. **Implement dispatcher** - start_dispatcher() background processing with semaphore concurrency
12. **Implement task processor** - process_task() method calling note+profile extractors, fetching images as data URLs, handling success/failure with RedNoteDBSchema

### FastAPI Server Layer (6 tasks)
13. **Create FastAPI app** - Basic setup with CORS
14. **Implement task endpoints** - POST /tasks and GET /tasks/{project_id}
15. **Implement task actions** - POST /tasks/{task_id}/retry and POST /tasks/{task_id}/delete  
16. **Implement project endpoints** - GET /projects, POST /projects, GET /projects/{project_id}/stats
17. **Implement export/queue endpoints** - GET /projects/{project_id}/export and GET /queue/status
18. **Add startup handler** - Initialize DB and start task queue dispatcher

### Integration Layer (2 tasks)
19. **Update main.py** - Environment validation and uvicorn server startup
20. **Integration test** - Complete flow: create project → add task → verify processing → check results

*Each task is atomic and can be validated independently before proceeding to the next.*

## Code Style Principles

### MVP Development Guidelines
1. **Type Hints Everywhere** - All function parameters and return types
   ```python
   def save_task(task: dict[str, Any]) -> None:
   def get_projects() -> list[dict[str, Any]]:
   ```

2. **No Comments or Docstrings** - Code should be self-explanatory
   ```python
   # Good - Clear function name
   def get_pending_tasks_by_project(project_id: str) -> list[dict[str, Any]]:
   
   # Bad - Needs comment to explain
   def process(data):  # processes the task data
   ```

3. **Fail Fast with Exceptions** - Raise errors immediately, don't return error codes
   ```python
   # Good
   if not project_id:
       raise ValueError("project_id is required")
   
   # Bad
   if not project_id:
       return {"error": "project_id is required"}
   ```

4. **Clarity Over Cleverness** - Explicit and readable code
   ```python
   # Good
   pending_tasks = [task for task in tasks.values() if task["status"] == "pending"]
   
   # Bad
   pending_tasks = list(filter(lambda t: t["status"] == "pending", tasks.values()))
   ```

5. **Simple Data Structures** - Use basic types, avoid complex classes
   - Pydantic for API validation
   - Plain dicts/lists for internal logic
   - No inheritance or complex abstractions

6. **Consistent Naming** - snake_case, descriptive names
   - Functions: `get_tasks_by_project()` not `get_tasks()`
   - Variables: `project_id` not `proj_id`
   - Files: `task_queue.py` not `taskQueue.py`

## Dependencies Added During Implementation
- `tinydb` - Lightweight NoSQL database for data persistence
- `httpx` - Modern async HTTP client for image fetching (replaced aiohttp)

## Key Implementation Notes
- All datetime fields stored as ISO strings for TinyDB JSON serialization compatibility
- Images fetched and stored as data URLs with proper MIME type detection
- User profile extraction with fallback to default values if profile URL unavailable
- Database validation using Pydantic schemas before insertion

## Testing Strategy

### Development Testing Approach
**Per File Validation:**
- Add inline validation at bottom of each file (`if __name__ == "__main__"`)
- Test basic functionality with sample data before moving to next file

**Per Layer Integration:**
- Test cross-file interactions after completing each layer
- Validate data flow between components

### Manual API Testing
**Primary Tools (in order of preference):**

1. **FastAPI Auto-Generated Docs** - `http://localhost:8000/docs`
   - Interactive Swagger UI for testing all endpoints
   - Built-in, no installation needed
   - Best for initial endpoint validation

2. **HTTPie** - `pip install httpie`
   ```bash
   # Project management
   http POST localhost:8000/projects name="test-project"
   http GET localhost:8000/projects
   
   # Task management  
   http POST localhost:8000/tasks project_id="proj-123" url="https://xiaohongshu.com/item/123"
   http GET localhost:8000/tasks/proj-123
   http GET localhost:8000/tasks/proj-123 status==pending
   
   # Task actions
   http POST localhost:8000/tasks/task-456/retry
   http POST localhost:8000/tasks/task-456/delete
   
   # Queue status
   http GET localhost:8000/queue/status
   ```

3. **curl** - Built-in fallback
   ```bash
   curl -X POST localhost:8000/tasks \
     -H "Content-Type: application/json" \
     -d '{"project_id":"proj-123","url":"https://xiaohongshu.com/item/123"}'
   ```

### Testing Workflow
1. **Start server**: `uv run python main.py`
2. **Open docs**: Visit `http://localhost:8000/docs` for visual testing
3. **Script tests**: Use HTTPie commands for repeated testing
4. **Validate flow**: Create project → Add task → Check processing → Verify results