// Popup JavaScript - Project key validation and connection
console.log('Popup script loaded');

let validationTimeout = null;

// Initialize popup
function init() {
  loadSavedKey();
  setupEventListeners();
}

// Setup event listeners with delegation
function setupEventListeners() {
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('paste', handlePaste);
}

// Handle all click events
function handleClick(e) {
  if (e.target.id === 'toggle-visibility') {
    toggleKeyVisibility();
  } else if (e.target.id === 'start-scraping') {
    startScraping();
  }
}

// Handle input events with debounced validation
function handleInput(e) {
  if (e.target.id === 'project-key') {
    const key = e.target.value.trim();
    
    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    // Debounce validation
    validationTimeout = setTimeout(() => {
      if (key) {
        validateKey(key);
      } else {
        resetValidation();
      }
    }, 500);
  }
}

// Handle paste events for immediate validation
function handlePaste(e) {
  if (e.target.id === 'project-key') {
    setTimeout(() => {
      const key = e.target.value.trim();
      if (key) {
        validateKey(key);
      }
    }, 10);
  }
}

// Load saved project key
async function loadSavedKey() {
  try {
    const result = await chrome.storage.local.get(['projectKey']);
    if (result.projectKey) {
      document.getElementById('project-key').value = result.projectKey;
      validateKey(result.projectKey);
    }
  } catch (error) {
    console.error('Failed to load saved key:', error);
  }
}

// Toggle password visibility
function toggleKeyVisibility() {
  const input = document.getElementById('project-key');
  const toggle = document.getElementById('toggle-visibility');
  
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '🙈';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
  }
}

// Validate project key
async function validateKey(key) {
  if (!key) return resetValidation();
  
  try {
    // Parse key format
    const decoded = atob(key);
    const parts = decoded.split('|');
    
    if (parts.length !== 3) {
      throw new Error('Invalid key format');
    }
    
    const [backendUrl, projectId, sessionToken] = parts;
    
    if (!backendUrl || !projectId || !sessionToken) {
      throw new Error('Missing key components');
    }
    
    // Validate with backend
    showStatus('Validating...', 'info');
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth for non-localhost
    if (!backendUrl.includes('localhost')) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    const response = await fetch(`${backendUrl}/projects`, { headers });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const projects = await response.json();
    const projectExists = projects.some(p => p.id === projectId);
    
    if (!projectExists) {
      throw new Error('Project not found');
    }
    
    // Success - save and enable button
    await chrome.storage.local.set({ 
      projectKey: key,
      config: { backendUrl, projectId, sessionToken }
    });
    
    showStatus('✓ Connected successfully', 'success');
    enableStartButton(true);
    
  } catch (error) {
    console.error('Validation failed:', error);
    showStatus(`✗ ${error.message}`, 'error');
    enableStartButton(false);
  }
}

// Show connection status
function showStatus(message, type) {
  const status = document.getElementById('connection-status');
  status.textContent = message;
  status.className = `connection-status ${type}`;
  status.style.display = 'block';
}

// Reset validation state
function resetValidation() {
  document.getElementById('connection-status').style.display = 'none';
  enableStartButton(false);
}

// Enable/disable start button
function enableStartButton(enabled) {
  const button = document.getElementById('start-scraping');
  button.disabled = !enabled;
  
  if (enabled) {
    button.textContent = '🚀 Start Scraping';
  } else {
    button.textContent = 'Connect & Start Scraping';
  }
}

// Start scraping - open sidepanel
async function startScraping() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  } catch (error) {
    console.error('Failed to open sidepanel:', error);
    showStatus('Failed to open scraper', 'error');
  }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}