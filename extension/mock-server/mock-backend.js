// Mock Backend Server for Social Media Research Assistant
// Mimics the FastAPI backend endpoints for extension testing

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory storage for testing
const storage = {
  projects: [
    {
      id: 'test-project-1',
      name: 'Test Research Project',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-project-2',
      name: 'Demo Analysis Project',
      created_at: new Date().toISOString()
    }
  ],
  tasks: [],
  successfulTasks: []
};

// Utility functions
function createTask(projectId, url = null, html = null) {
  return {
    id: uuidv4(),
    project_id: projectId,
    url: url || '',
    html: html,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    error_msg: null
  };
}

function simulateProcessing(task) {
  // Simulate async processing
  setTimeout(() => {
    // Move from tasks to successful tasks
    const index = storage.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      storage.tasks.splice(index, 1);
      
      // Create successful task record
      const successfulTask = {
        id: task.id,
        project_id: task.project_id,
        url: task.url,
        html: task.html,
        created_at: task.created_at.toISOString(),
        note_content: {
          title: 'Mock Extracted Content',
          content: 'This is **mock content** extracted from the submitted HTML.',
          author_name: 'Mock Author',
          date: new Date().toISOString().split('T')[0],
          tags: ['test', 'mock', 'research'],
          like_count: Math.floor(Math.random() * 1000),
          comment_count: Math.floor(Math.random() * 50),
          favorite_count: Math.floor(Math.random() * 200),
          location: '北京',
          image_urls: [],
          video_urls: [],
          author_avatar_url: 'https://example.com/avatar.jpg',
          author_profile_url: 'https://example.com/profile',
          comments: []
        },
        user_profile: {
          author_name: 'Mock Author',
          location: '上海',
          author_avatar_url: 'https://example.com/avatar.jpg',
          introduction: 'Mock user profile for testing',
          related_topics: ['AI', 'Technology'],
          interests: ['Research', 'Data'],
          career: 'Software Engineer'
        },
        token_usage: Math.floor(Math.random() * 5000),
        processing_time_seconds: Math.floor(Math.random() * 60)
      };
      
      storage.successfulTasks.push(successfulTask);
      console.log(`✓ Processed task ${task.id} successfully`);
    }
  }, 2000 + Math.random() * 3000); // 2-5 seconds
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Social Media Research Assistant Mock Server',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /projects',
      'POST /projects',
      'POST /tasks',
      'GET /tasks/:project_id',
      'GET /projects/:project_id/stats',
      'GET /projects/:project_id/export'
    ]
  });
});

// Get all projects
app.get('/projects', (req, res) => {
  console.log('📂 GET /projects');
  res.json(storage.projects);
});

// Create new project
app.post('/projects', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ detail: 'name is required' });
  }
  
  const project = {
    id: uuidv4(),
    name,
    created_at: new Date().toISOString()
  };
  
  storage.projects.push(project);
  console.log(`📂 POST /projects - Created: ${project.name}`);
  
  res.json(project);
});

// Create new task
app.post('/tasks', (req, res) => {
  const { project_id, url, html } = req.body;
  
  if (!project_id) {
    return res.status(400).json({ detail: 'project_id is required' });
  }
  
  if (!url && !html) {
    return res.status(400).json({ detail: 'either url or html is required' });
  }
  
  // Check if project exists
  const project = storage.projects.find(p => p.id === project_id);
  if (!project) {
    return res.status(404).json({ detail: 'project not found' });
  }
  
  const task = createTask(project_id, url, html);
  storage.tasks.push(task);
  
  console.log(`📋 POST /tasks - Created task ${task.id} for project ${project.name}`);
  console.log(`   URL: ${url || 'N/A'}`);
  console.log(`   HTML: ${html ? `${html.length} chars` : 'N/A'}`);
  
  // Start processing simulation
  simulateProcessing(task);
  
  res.json({
    id: task.id,
    project_id: task.project_id,
    url: task.url,
    html: task.html,
    status: task.status,
    created_at: task.created_at,
    updated_at: task.updated_at,
    error_msg: task.error_msg
  });
});

// Get tasks by project
app.get('/tasks/:project_id', (req, res) => {
  const { project_id } = req.params;
  const { status } = req.query;
  
  console.log(`📋 GET /tasks/${project_id}${status ? `?status=${status}` : ''}`);
  
  let projectTasks = [];
  
  // Get tasks from queue
  const queueTasks = storage.tasks
    .filter(t => t.project_id === project_id)
    .filter(t => !status || t.status === status)
    .map(t => ({
      id: t.id,
      project_id: t.project_id,
      url: t.url,
      html: t.html,
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
      error_msg: t.error_msg
    }));
  
  projectTasks.push(...queueTasks);
  
  // Get successful tasks if requested
  if (!status || status === 'success') {
    const successTasks = storage.successfulTasks
      .filter(t => t.project_id === project_id)
      .map(t => ({
        id: t.id,
        project_id: t.project_id,
        url: t.url,
        html: t.html,
        status: 'success',
        created_at: new Date(t.created_at),
        updated_at: new Date(t.created_at),
        error_msg: null
      }));
    
    if (status === 'success') {
      projectTasks = successTasks;
    } else {
      projectTasks.push(...successTasks);
    }
  }
  
  res.json(projectTasks);
});

// Get project statistics
app.get('/projects/:project_id/stats', (req, res) => {
  const { project_id } = req.params;
  
  console.log(`📊 GET /projects/${project_id}/stats`);
  
  const queueTasks = storage.tasks.filter(t => t.project_id === project_id);
  const successfulTasks = storage.successfulTasks.filter(t => t.project_id === project_id);
  
  const stats = {
    total_tasks: queueTasks.length + successfulTasks.length,
    pending_tasks: queueTasks.filter(t => t.status === 'pending').length,
    processing_tasks: queueTasks.filter(t => t.status === 'processing').length,
    failed_tasks: queueTasks.filter(t => t.status === 'failed').length,
    successful_tasks: successfulTasks.length,
    token_usage: successfulTasks.reduce((sum, t) => sum + (t.token_usage || 0), 0),
    processing_time_seconds: successfulTasks.reduce((sum, t) => sum + (t.processing_time_seconds || 0), 0)
  };
  
  res.json(stats);
});

// Export project data
app.get('/projects/:project_id/export', (req, res) => {
  const { project_id } = req.params;
  
  console.log(`📤 GET /projects/${project_id}/export`);
  
  const project = storage.projects.find(p => p.id === project_id);
  const successfulTasks = storage.successfulTasks.filter(t => t.project_id === project_id);
  
  if (!project) {
    return res.status(404).json({ detail: 'project not found' });
  }
  
  const exportData = {
    project,
    tasks: successfulTasks,
    exported_at: new Date().toISOString(),
    total_tasks: successfulTasks.length
  };
  
  res.json(exportData);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    detail: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    detail: 'Endpoint not found',
    available_endpoints: [
      'GET /',
      'GET /projects',
      'POST /projects',
      'POST /tasks',
      'GET /tasks/:project_id',
      'GET /projects/:project_id/stats',
      'GET /projects/:project_id/export'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Social Media Research Assistant Mock Server');
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log('\n📊 Initial Data:');
  console.log(`   Projects: ${storage.projects.length}`);
  console.log(`   Tasks: ${storage.tasks.length}`);
  console.log('\n📖 Available endpoints:');
  console.log('   GET  / - Server info');
  console.log('   GET  /projects - List projects');
  console.log('   POST /projects - Create project');
  console.log('   POST /tasks - Submit task');
  console.log('   GET  /tasks/:project_id - Get project tasks');
  console.log('   GET  /projects/:project_id/stats - Project statistics');
  console.log('   GET  /projects/:project_id/export - Export project');
  console.log('\n💡 Test project-key (base64): ' + Buffer.from(`http://localhost:${PORT}|test-project-1|mock-token-123`).toString('base64'));
  console.log('');
});