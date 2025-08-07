# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **vibeScope** - a natural language driven content analysis platform built for analyzing user-generated content from social media platforms like 小红书 (Xiaohongshu/RedNote), Zhihu, and WeChat public accounts. The system extracts and analyzes authentic market feedback and user insights for content research.

## Architecture

The project follows a modern full-stack architecture with clear separation between frontend and backend:

### Backend (FastAPI + Python)
- **Location**: `server/` directory
- **Framework**: FastAPI with async processing
- **Database**: TinyDB (JSON-based NoSQL) for lightweight persistence  
- **Content Processing**: crawl4ai + OpenAI API for LLM-powered content extraction
- **Task Queue**: In-memory queue with semaphore-controlled concurrency (max 2 concurrent)

### Frontend (Next.js + React)
- **Location**: `frontend/` directory  
- **Framework**: Next.js 15 with App Router and React 19
- **UI**: shadcn/ui components with Tailwind CSS v4
- **State Management**: TanStack Query for server state, Zustand for client state
- **Visualization**: ECharts for data visualization

## Development Commands

### Backend Development
```bash
# Navigate to server directory
cd server

# Start production server (runs on http://localhost:8000)
uv run python main.py

# Run component tests (no server required)
uv run python test_offline.py

# Run integration tests (requires running server)
# Terminal 1: uv run python main.py
# Terminal 2: uv run python integration_test.py

# View API documentation at http://localhost:8000/docs
```

### Frontend Development  
```bash
# Navigate to frontend directory
cd frontend

# Start development server (runs on http://localhost:6626)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Start production server
npm run start
```

### Full Stack Development
```bash
# Terminal 1: Start backend
cd server && uv run python main.py

# Terminal 2: Start frontend  
cd frontend && npm run dev

# Access application at http://localhost:6626
# Backend API at http://localhost:8000
```

## Data Processing Pipeline

### Core Flow
1. **Input**: URLs or raw HTML content submitted via frontend
2. **Queue Management**: Tasks added to in-memory queue with pending/processing/failed states
3. **Content Extraction**: crawl4ai extracts content using LLM-powered structured extraction
4. **Data Storage**: Successful extractions saved to TinyDB with complete schema validation
5. **Real-time Updates**: Frontend polls backend for task status and statistics

### Key Components
- **`server/task_queue.py`**: Background task processing with retry mechanisms
- **`server/extractor.py`**: LLM-powered content extraction for social media platforms
- **`server/db.py`**: TinyDB persistence layer with project isolation
- **`server/schema.py`**: Pydantic models for type safety and validation
- **`frontend/src/lib/api.ts`**: Frontend API client with TypeScript types

## Database Schema

### Extraction Schema (RedNote/小红书)
- **Post Content**: title, content (markdown), tags, location, timestamps
- **Engagement**: like_count, comment_count, favorite_count  
- **Media**: image_urls, video_urls (with base64 data URL conversion)
- **Author Profile**: demographics, interests, career, location inference
- **Comments**: first 10 comments with author info and replies

### Storage Structure
- **`projects.json`**: Project metadata and management
- **`successful_tasks.json`**: Complete extraction results with full content
- **In-memory queue**: Active tasks with real-time status tracking

## API Endpoints

### Task Management
- `POST /tasks` - Add URL/HTML to processing queue
- `GET /tasks/{project_id}` - List tasks with status filtering  
- `POST /tasks/{task_id}/retry` - Retry failed extractions
- `POST /tasks/{task_id}/delete` - Remove tasks from queue

### Project Management
- `GET /projects` - List all research projects
- `POST /projects` - Create new project with JSON payload
- `GET /projects/{project_id}/stats` - Real-time project statistics
- `GET /projects/{project_id}/export` - Export complete project data as JSON

### System Monitoring
- `GET /queue/status` - Real-time queue status and health metrics

## Environment Configuration

Create `.env` file in `server/` directory:
```
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://openai.example.com/v1
OPENAI_MODEL=google/gemini-2.0-flash-thinking-exp
```

## Frontend Architecture

### Layout Structure
- **Header**: Project selector (fzf-style) + real-time statistics cards
- **Main Area**: Task kanban (3 columns: pending/processing/failed) + success data grid
- **Left Sidebar**: Statistical charts with ECharts visualizations  
- **Right Sidebar**: AI chat interface for RAG queries (planned)
- **Footer**: Simple copyright and version info

### Key Features
- **Real-time Updates**: Automatic polling for task status and statistics
- **Project Isolation**: Multi-project support with independent data storage
- **Rich Content Display**: Markdown rendering, image galleries, user profiles
- **Export Functionality**: JSON export for presentation and analysis
- **Responsive Design**: Modern flat design optimized for desktop use

## Production Considerations

### Current Status
- ✅ **Backend Complete**: All core functionality implemented and tested
- ✅ **Frontend Structure**: Component architecture with real-time updates
- ✅ **API Integration**: Full frontend-backend connectivity established
- 🔄 **AI Features**: RAG/chat functionality planned for future iterations

### Scalability Notes
- **Concurrency**: Semaphore limits (max 2) prevent overload and rate limiting
- **Database**: TinyDB suitable for MVP; consider PostgreSQL for production scale
- **Caching**: TanStack Query provides intelligent caching and background sync
- **Error Handling**: Comprehensive retry mechanisms and graceful failure recovery

## Target Use Case

This tool is designed for **internal research teams** conducting market analysis of Chinese social media platforms, specifically for AI companion product development. Users can create research projects, submit URLs for content extraction, monitor processing status through a kanban interface, and export structured data for presentation and analysis.

## Development Best Practices

### Python Environment
- **Dependency Management**: Uses `uv` for fast Python package management
- **Virtual Environment**: `.venv` directory contains isolated Python environment
- **No pyproject.toml**: Dependencies managed directly through uv commands

### TypeScript Configuration
- **Path Aliases**: `@/*` maps to `./src/*` in frontend for clean imports
- **Next.js Integration**: TypeScript configured with Next.js plugin for optimal development experience

### Git Workflow
- **Commit Management**:
  - git add should go with dry-run first and do not add any file that is not relevant with the task in session.