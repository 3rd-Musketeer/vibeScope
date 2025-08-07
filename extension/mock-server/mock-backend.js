// Mock Backend Server for vibeScope
// Mimics the FastAPI backend endpoints for extension testing

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for debug page
app.use('/static', express.static(path.join(__dirname, 'static')));

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
  successfulTasks: [],
  recentSubmissions: [] // Track recent extension submissions for debug page
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

// Utility function to call nano FastAPI extractor server
async function callExtractor(html, url) {
  const NANO_SERVER_URL = 'http://localhost:3002';
  
  try {
    const response = await fetch(`${NANO_SERVER_URL}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
        url: url || null
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Nano extractor server not running. Start it with: python3 nano_server.py');
    }
    throw error;
  }
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'vibeScope Mock Server',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /projects',
      'POST /projects', 
      'POST /tasks',
      'GET /tasks/:project_id',
      'GET /projects/:project_id/stats',
      'GET /projects/:project_id/export',
      'GET /debug - Debug page for testing extractor'
    ]
  });
});

// Debug page
app.get('/debug', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Mock Server Debug - Extension Monitor</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1400px; margin: 0 auto; padding: 20px; }
        .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .panel { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .panel h2 { margin-top: 0; color: #374151; }
        .full-width { grid-column: 1 / -1; }
        textarea { width: 100%; min-height: 200px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 12px; }
        button { background: #2563eb; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 8px; margin-bottom: 8px; }
        button:hover { background: #1d4ed8; }
        button:disabled { background: #9ca3af; cursor: not-allowed; }
        button.secondary { background: #6b7280; }
        button.secondary:hover { background: #4b5563; }
        button.danger { background: #dc2626; }
        button.danger:hover { background: #b91c1c; }
        .result { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 10px; }
        .error { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        .success { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
        .loading { opacity: 0.5; }
        pre { margin: 0; white-space: pre-wrap; font-size: 12px; max-height: 300px; overflow-y: auto; }
        .stats { display: flex; gap: 10px; margin-bottom: 10px; }
        .stat { padding: 8px 12px; background: #f3f4f6; border-radius: 4px; font-size: 12px; }
        input[type="url"] { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 10px; }
        .submission-item { border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
        .submission-header { display: flex; justify-content: between; align-items: center; margin-bottom: 8px; }
        .submission-meta { font-size: 12px; color: #6b7280; }
        .submission-content { font-family: monospace; font-size: 11px; background: #f8f9fa; padding: 8px; border-radius: 4px; max-height: 150px; overflow-y: auto; }
        .live-indicator { display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .no-submissions { text-align: center; color: #6b7280; padding: 40px; }
    </style>
</head>
<body>
    <h1>🔍 Mock Server Debug - Extension Monitor</h1>
    <p>Monitor extension submissions in real-time and test the backend extractor.</p>
    
    <div class="container">
        <div class="panel">
            <h2>📝 Manual Test</h2>
            <input type="url" id="url" placeholder="https://example.com (optional)" />
            <textarea id="html" placeholder="Paste HTML content here to test extraction..."></textarea>
            <button id="extract" onclick="testExtractor()">🚀 Test Extraction</button>
            
            <div style="margin-top: 20px;">
                <h3>📋 Sample HTML</h3>
                <button class="secondary" onclick="loadSample()">Load Xiaohongshu Sample</button>
                <button class="secondary" onclick="loadWeibo()">Load Weibo Sample</button>
            </div>
        </div>
        
        <div class="panel">
            <h2>📊 Test Result</h2>
            <div id="stats" class="stats" style="display: none;">
                <div class="stat">Status: <span id="status">-</span></div>
                <div class="stat">Time: <span id="time">-</span></div>
                <div class="stat">Size: <span id="size">-</span></div>
            </div>
            <div id="result" class="result">
                <pre>Click "Test Extraction" to see results...</pre>
            </div>
        </div>
    </div>
    
    <div class="panel full-width">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0;"><span class="live-indicator"></span>Extension Submissions</h2>
            <div>
                <button class="secondary" onclick="refreshSubmissions()">🔄 Refresh</button>
                <button class="danger" onclick="clearSubmissions()">🗑️ Clear</button>
                <label style="margin-left: 16px; font-size: 12px;">
                    <input type="checkbox" id="autoRefresh" checked onchange="toggleAutoRefresh()"> Auto-refresh (5s)
                </label>
            </div>
        </div>
        <div id="submissions">
            <div class="no-submissions">
                No extension submissions yet. Use the extension to capture content and it will appear here.
            </div>
        </div>
    </div>

    <script>
        let autoRefreshInterval = null;
        
        // Auto refresh submissions
        function toggleAutoRefresh() {
            const checkbox = document.getElementById('autoRefresh');
            if (checkbox.checked) {
                autoRefreshInterval = setInterval(refreshSubmissions, 5000);
            } else {
                clearInterval(autoRefreshInterval);
            }
        }
        
        // Load submissions from server
        async function refreshSubmissions() {
            try {
                const response = await fetch('/debug/submissions');
                const submissions = await response.json();
                displaySubmissions(submissions);
            } catch (error) {
                console.error('Failed to refresh submissions:', error);
            }
        }
        
        // Display submissions in UI
        function displaySubmissions(submissions) {
            const container = document.getElementById('submissions');
            
            if (submissions.length === 0) {
                container.innerHTML = '<div class="no-submissions">No extension submissions yet. Use the extension to capture content and it will appear here.</div>';
                return;
            }
            
            container.innerHTML = submissions.map(sub => \`
                <div class="submission-item">
                    <div class="submission-header">
                        <strong>\${sub.project_name || 'Unknown Project'}</strong>
                        <div class="submission-meta">
                            \${new Date(sub.timestamp).toLocaleTimeString()} • 
                            \${sub.html_length ? (sub.html_length / 1024).toFixed(1) + ' KB' : 'No HTML'} •
                            \${sub.method || 'Unknown method'}
                        </div>
                    </div>
                    <div class="submission-meta">
                        <strong>URL:</strong> \${sub.url || 'Not provided'}<br>
                        <strong>Project ID:</strong> \${sub.project_id || 'Unknown'}
                    </div>
                    <div class="submission-content">
                        <div style="margin-bottom: 8px; font-weight: bold;">HTML Content (\${sub.html_length || 0} characters):</div>
                        <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 4px; padding: 8px; font-size: 12px; color: #0c4a6e;">
                            📄 HTML content available (\${(sub.html_length / 1024).toFixed(1)} KB) - Click "Load in Test" to view content
                        </div>
                    </div>
                    <div style="margin-top: 8px;">
                        <button class="secondary" onclick="loadSubmissionToTest('\${sub.id}')">📝 Load in Test</button>
                        <button class="secondary" onclick="extractSubmission('\${sub.id}')">🚀 Extract</button>
                    </div>
                </div>
            \`).join('');
        }
        
        // Clear all submissions
        async function clearSubmissions() {
            if (!confirm('Clear all submission history?')) return;
            
            try {
                await fetch('/debug/submissions', { method: 'DELETE' });
                refreshSubmissions();
            } catch (error) {
                console.error('Failed to clear submissions:', error);
            }
        }
        
        // Load submission into manual test form
        async function loadSubmissionToTest(submissionId) {
            try {
                const response = await fetch(\`/debug/submissions/\${submissionId}\`);
                const submission = await response.json();
                
                document.getElementById('url').value = submission.url || '';
                document.getElementById('html').value = submission.html || '';
            } catch (error) {
                console.error('Failed to load submission:', error);
            }
        }
        
        // Extract specific submission
        async function extractSubmission(submissionId) {
            try {
                const response = await fetch(\`/debug/submissions/\${submissionId}\`);
                const submission = await response.json();
                
                if (!submission.html) {
                    alert('No HTML content to extract');
                    return;
                }
                
                // Load into test form and run extraction
                document.getElementById('url').value = submission.url || '';
                document.getElementById('html').value = submission.html;
                testExtractor();
            } catch (error) {
                console.error('Failed to extract submission:', error);
            }
        }
        
        // Start auto refresh on page load
        document.addEventListener('DOMContentLoaded', () => {
            refreshSubmissions();
            toggleAutoRefresh();
        });

        async function testExtractor() {
            const html = document.getElementById('html').value.trim();
            const url = document.getElementById('url').value.trim();
            const extractBtn = document.getElementById('extract');
            const result = document.getElementById('result');
            const stats = document.getElementById('stats');
            
            if (!html) {
                alert('Please enter HTML content to test');
                return;
            }
            
            // Show loading state
            extractBtn.disabled = true;
            extractBtn.textContent = '⏳ Extracting...';
            result.className = 'result loading';
            result.innerHTML = '<pre>Processing with backend extractor...</pre>';
            
            const startTime = Date.now();
            
            try {
                const response = await fetch('/debug/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ html, url: url || null })
                });
                
                const data = await response.json();
                const endTime = Date.now();
                
                // Update stats
                document.getElementById('status').textContent = response.ok ? 'Success' : 'Error';
                document.getElementById('time').textContent = (endTime - startTime) + 'ms';
                document.getElementById('size').textContent = (JSON.stringify(data).length / 1024).toFixed(1) + ' KB';
                stats.style.display = 'flex';
                
                // Show result
                if (response.ok) {
                    result.className = 'result success';
                    result.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } else {
                    result.className = 'result error';
                    result.innerHTML = '<pre>Error: ' + (data.error || 'Unknown error') + '</pre>';
                }
                
            } catch (error) {
                const endTime = Date.now();
                document.getElementById('status').textContent = 'Network Error';
                document.getElementById('time').textContent = (endTime - startTime) + 'ms';
                stats.style.display = 'flex';
                
                result.className = 'result error';
                result.innerHTML = '<pre>Network Error: ' + error.message + '</pre>';
            }
            
            // Reset button
            extractBtn.disabled = false;
            extractBtn.textContent = '🚀 Test Extraction';
        }
        
        function loadSample() {
            document.getElementById('url').value = 'https://xiaohongshu.com/explore/123';
            document.getElementById('html').value = \`<html>
<head><title>小红书测试</title></head>
<body>
    <div class="note-content">
        <h1>AI伴侣产品调研分享</h1>
        <p>最近体验了几款AI陪伴应用，发现用户对情感陪伴的需求很强烈。主要功能包括：</p>
        <ul>
            <li>智能对话：能理解情绪和语境</li>
            <li>个性化设定：可自定义角色形象</li>
            <li>情感支持：提供心理慰藉和建议</li>
        </ul>
        <p>用户反馈普遍积极，尤其是对话的自然度和情感理解能力。</p>
        <div class="tags">#AI伴侣 #产品调研 #人工智能 #情感陪伴</div>
        <div class="author">
            <span class="name">产品研究员小李</span>
            <span class="location">上海</span>
        </div>
        <div class="stats">
            <span class="likes">1234赞</span>
            <span class="comments">56评论</span>
            <span class="favorites">89收藏</span>
        </div>
    </div>
</body>
</html>\`;
        }
        
        function loadWeibo() {
            document.getElementById('url').value = 'https://weibo.com/status/123';
            document.getElementById('html').value = \`<html>
<head><title>微博测试</title></head>
<body>
    <div class="weibo-content">
        <div class="author-info">
            <span class="nickname">AI产品观察家</span>
            <span class="location">北京</span>
        </div>
        <div class="text">
            刚体验了最新的AI聊天机器人，对话能力确实有了质的提升！不仅能记住上下文，还能理解情感暗示。
            这对于需要情感陪伴的用户来说太重要了 👍
            #人工智能 #AI技术 #智能对话
        </div>
        <div class="media">
            <img src="/image1.jpg" alt="AI界面截图">
        </div>
        <div class="toolbar">
            <span class="forward">转发 23</span>
            <span class="comment">评论 45</span>  
            <span class="like">赞 156</span>
        </div>
    </div>
</body>
</html>\`;
        }
    </script>
</body>
</html>
  `);
});

// Debug API endpoint to test extractor
app.post('/debug/extract', async (req, res) => {
  const { html, url } = req.body;
  
  if (!html) {
    return res.status(400).json({ error: 'HTML content is required' });
  }
  
  console.log('🔬 POST /debug/extract');
  console.log(`   URL: ${url || 'N/A'}`);
  console.log(`   HTML: ${html.length} characters`);
  
  try {
    const result = await callExtractor(html, url);
    console.log('   ✅ Extraction successful');
    res.json(result);
  } catch (error) {
    console.log('   ❌ Extraction failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced task creation with real extractor option
app.post('/tasks/extract', async (req, res) => {
  const { project_id, url, html, use_real_extractor = false } = req.body;
  
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
  
  console.log(`📋 POST /tasks/extract - Created task ${task.id} for project ${project.name}`);
  console.log(`   Use real extractor: ${use_real_extractor}`);
  console.log(`   URL: ${url || 'N/A'}`);
  console.log(`   HTML: ${html ? `${html.length} chars` : 'N/A'}`);
  
  // Process with real extractor or mock
  if (use_real_extractor && html) {
    processWithRealExtractor(task, html, url);
  } else {
    simulateProcessing(task);
  }
  
  res.json({
    id: task.id,
    project_id: task.project_id,
    url: task.url,
    html: task.html,
    status: task.status,
    created_at: task.created_at,
    updated_at: task.updated_at,
    error_msg: task.error_msg,
    use_real_extractor
  });
});

async function processWithRealExtractor(task, html, url) {
  console.log(`🔬 Processing task ${task.id} with real extractor`);
  
  try {
    // Update task status
    task.status = 'processing';
    task.updated_at = new Date();
    
    // Call real extractor
    const extractedData = await callExtractor(html, url);
    
    // Remove from queue and add to successful tasks
    const index = storage.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      storage.tasks.splice(index, 1);
      
      const successfulTask = {
        id: task.id,
        project_id: task.project_id,
        url: task.url,
        html: task.html,
        created_at: task.created_at.toISOString(),
        note_content: extractedData.content || {},
        user_profile: extractedData.user_profile || {},
        token_usage: extractedData.token_usage || 0,
        processing_time_seconds: extractedData.processing_time_seconds || 0,
        extracted_with_real_backend: true
      };
      
      storage.successfulTasks.push(successfulTask);
      console.log(`✅ Real extraction completed for task ${task.id}`);
    }
    
  } catch (error) {
    console.log(`❌ Real extraction failed for task ${task.id}:`, error.message);
    
    // Mark task as failed
    task.status = 'failed';
    task.error_msg = error.message;
    task.updated_at = new Date();
  }
}

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
  
  // Track submission for debug page
  const submission = {
    id: uuidv4(),
    project_id,
    project_name: project.name,
    url,
    html,
    method: 'Extension Submit',
    timestamp: new Date().toISOString(),
    task_id: null
  };
  
  // Keep only last 50 submissions
  storage.recentSubmissions.push(submission);
  if (storage.recentSubmissions.length > 50) {
    storage.recentSubmissions = storage.recentSubmissions.slice(-50);
  }
  
  const task = createTask(project_id, url, html);
  storage.tasks.push(task);
  
  // Link submission to task
  submission.task_id = task.id;
  
  console.log(`📋 POST /tasks - Created task ${task.id} for project ${project.name}`);
  console.log(`   URL: ${url || 'N/A'}`);
  console.log(`   HTML: ${html ? `${html.length} chars` : 'N/A'}`);
  console.log(`   📊 Tracked for debug page (submission ${submission.id})`);
  
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

// Debug API: Get recent submissions
app.get('/debug/submissions', (req, res) => {
  console.log(`📊 GET /debug/submissions - ${storage.recentSubmissions.length} submissions`);
  
  // Return submissions sorted by most recent first
  const submissions = storage.recentSubmissions
    .slice()
    .reverse()
    .map(sub => ({
      ...sub,
      // Don't send full HTML in list view for performance
      html_length: sub.html ? sub.html.length : 0,
      html: null
    }));
  
  res.json(submissions);
});

// Debug API: Get specific submission with full data
app.get('/debug/submissions/:id', (req, res) => {
  const { id } = req.params;
  const submission = storage.recentSubmissions.find(s => s.id === id);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  console.log(`📊 GET /debug/submissions/${id} - ${submission.html ? submission.html.length : 0} chars`);
  res.json(submission);
});

// Debug API: Clear all submissions
app.delete('/debug/submissions', (req, res) => {
  console.log('🗑️ DELETE /debug/submissions - Clearing all submissions');
  storage.recentSubmissions = [];
  res.json({ message: 'All submissions cleared' });
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
  console.log('\n🚀 vibeScope Mock Server');
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log('\n📊 Initial Data:');
  console.log(`   Projects: ${storage.projects.length}`);
  console.log(`   Tasks: ${storage.tasks.length}`);
  console.log('\n📖 Available endpoints:');
  console.log('   GET  / - Server info');
  console.log('   GET  /debug - 🔬 Debug page for testing extractor');
  console.log('   POST /debug/extract - Test extractor directly');
  console.log('   GET  /projects - List projects');
  console.log('   POST /projects - Create project');
  console.log('   POST /tasks - Submit task (mock processing)');
  console.log('   POST /tasks/extract - Submit task with real extractor option');
  console.log('   GET  /tasks/:project_id - Get project tasks');
  console.log('   GET  /projects/:project_id/stats - Project statistics');
  console.log('   GET  /projects/:project_id/export - Export project');
  console.log('\n🔬 Debug Tools:');
  console.log(`   Open http://localhost:${PORT}/debug to test the nano extractor`);
  console.log('   🧪 Using Nano FastAPI Extractor Server (HTTP API)');
  console.log('\n🌐 Required Services:');
  console.log('   📊 Mock Server (this): http://localhost:3001');
  console.log('   🔬 Nano Extractor API: http://localhost:3002 (must be running)');
  console.log('\n💡 Test project-key (base64): ' + Buffer.from(`http://localhost:${PORT}|test-project-1|mock-token-123`).toString('base64'));
  console.log('\n⚠️  Setup Required:');
  console.log('   1. Run ./setup_nano.sh and copy .env file');
  console.log('   2. Start nano server: python3 nano_server.py');
  console.log('   3. Test workflow at /debug page');
  console.log('');
});