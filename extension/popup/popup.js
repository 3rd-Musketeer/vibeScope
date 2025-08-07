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

// Load saved project token
async function loadSavedKey() {
  try {
    const result = await chrome.storage.local.get(['projectToken']);
    if (result.projectToken) {
      document.getElementById('project-key').value = result.projectToken;
      validateKey(result.projectToken);
    }
  } catch (error) {
    console.error('Failed to load saved token:', error);
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

// Validate project token
async function validateKey(token) {
  if (!token) return resetValidation();
  
  try {
    // Validate token with backend
    showStatus('Validating...', 'info');
    
    const response = await fetch(`https://api.onehalf.tech/projects/by-token/${token}`);
    
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    
    const project = await response.json();
    
    // Success - save token and project info
    await chrome.storage.local.set({ 
      projectToken: token,
      config: { 
        backendUrl: 'https://api.onehalf.tech',
        projectId: project.id, 
        projectName: project.name,
        token: token
      }
    });
    
    showStatus(`✓ Connected to "${project.name}"`, 'success');
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