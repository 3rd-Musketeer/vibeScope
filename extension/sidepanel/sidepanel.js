// Sidepanel JavaScript for Social Media Research Assistant
// Handles UI interactions, state management, and communication with background script

console.log('Sidepanel script loaded');

// DOM elements
const elements = {
  // Status
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),
  
  // Configuration
  configSection: document.getElementById('config-section'),
  projectKeyInput: document.getElementById('project-key'),
  toggleKeyBtn: document.getElementById('toggle-key-visibility'),
  connectBtn: document.getElementById('connect-btn'),
  configInfo: document.getElementById('config-info'),
  projectId: document.getElementById('project-id'),
  backendUrl: document.getElementById('backend-url'),
  
  // Capture controls
  captureSection: document.getElementById('capture-section'),
  captureFullPageBtn: document.getElementById('capture-full-page'),
  startSelectionBtn: document.getElementById('start-selection'),
  stopSelectionBtn: document.getElementById('stop-selection'),
  
  // Preview
  previewSection: document.getElementById('preview-section'),
  previewTitle: document.getElementById('preview-title'),
  clearPreviewBtn: document.getElementById('clear-preview'),
  elementInfo: document.getElementById('element-info'),
  elementTag: document.getElementById('element-tag'),
  elementSelector: document.getElementById('element-selector'),
  elementContent: document.getElementById('element-content'),
  visualPreview: document.getElementById('visual-preview'),
  previewImage: document.getElementById('preview-image'),
  pageInfo: document.getElementById('page-info'),
  pageTitle: document.getElementById('page-title'),
  pageUrl: document.getElementById('page-url'),
  submitControls: document.getElementById('submit-controls'),
  submitContentBtn: document.getElementById('submit-content'),
  
  // Activity log
  activityLog: document.getElementById('activity-log'),
  
  // Loading
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingMessage: document.getElementById('loading-message')
};

// Application state
let appState = {
  isConnected: false,
  config: null,
  isSelectionMode: false,
  selectedElement: null,
  capturedContent: null
};

// Initialize the application
function init() {
  setupEventListeners();
  loadSavedConfig();
  addLogEntry('Sidepanel initialized');
}

// Setup event listeners
function setupEventListeners() {
  // Configuration
  elements.toggleKeyBtn.addEventListener('click', toggleKeyVisibility);
  elements.connectBtn.addEventListener('click', handleConnect);
  elements.projectKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  });
  
  // Capture controls
  elements.captureFullPageBtn.addEventListener('click', handleFullPageCapture);
  elements.startSelectionBtn.addEventListener('click', handleStartSelection);
  elements.stopSelectionBtn.addEventListener('click', handleStopSelection);
  
  // Preview controls
  elements.clearPreviewBtn.addEventListener('click', clearPreview);
  elements.submitContentBtn.addEventListener('click', handleSubmitContent);
  
  // Message listener for background script
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Load saved configuration
async function loadSavedConfig() {
  try {
    const result = await chrome.storage.local.get(['projectKey', 'config']);
    if (result.projectKey && result.config) {
      elements.projectKeyInput.value = result.projectKey;
      updateConnectionStatus(true, result.config);
      addLogEntry('Restored saved configuration');
    }
  } catch (error) {
    console.error('Failed to load saved config:', error);
    addLogEntry('Failed to load saved configuration', 'error');
  }
}

// Toggle project key visibility
function toggleKeyVisibility() {
  const input = elements.projectKeyInput;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  elements.toggleKeyBtn.textContent = isPassword ? '🙈' : '👁️';
}

// Handle connect button click
async function handleConnect() {
  const projectKey = elements.projectKeyInput.value.trim();
  if (!projectKey) {
    showError('Please enter a project key');
    return;
  }
  
  // Basic project key validation
  try {
    atob(projectKey);
  } catch (error) {
    showError('Invalid project key format (not base64)');
    return;
  }
  
  showLoading('Connecting to backend...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SET_PROJECT_KEY',
      projectKey: projectKey
    });
    
    if (response.success) {
      updateConnectionStatus(true, response.config);
      addLogEntry('Successfully connected to backend');
      showSuccess('Connection established successfully!');
    } else {
      throw new Error(response.error || 'Failed to connect');
    }
  } catch (error) {
    console.error('Connection failed:', error);
    showError(`Connection failed: ${error.message}`);
    updateConnectionStatus(false);
  } finally {
    hideLoading();
  }
}

// Update connection status UI
function updateConnectionStatus(connected, config = null) {
  appState.isConnected = connected;
  appState.config = config;
  
  if (connected && config) {
    elements.statusDot.className = 'status-dot connected';
    elements.statusText.textContent = 'Connected';
    elements.configInfo.style.display = 'block';
    elements.projectId.textContent = config.projectId;
    elements.backendUrl.textContent = config.backendUrl;
    elements.captureSection.style.display = 'block';
  } else {
    elements.statusDot.className = 'status-dot disconnected';
    elements.statusText.textContent = 'Not Connected';
    elements.configInfo.style.display = 'none';
    elements.captureSection.style.display = 'none';
    clearPreview();
  }
}

// Handle full page capture
async function handleFullPageCapture() {
  if (!appState.isConnected) {
    showError('Please connect to backend first');
    return;
  }
  
  showLoading('Capturing full page...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // First get the page content directly from content script
    console.log('Sending GET_FULL_PAGE_HTML to tab:', tab.id);
    
    const pageResponse = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_FULL_PAGE_HTML'
    });
    
    console.log('GET_FULL_PAGE_HTML response:', pageResponse);
    
    if (!pageResponse || !pageResponse.success) {
      if (!pageResponse) {
        throw new Error('Content script not responding. Please refresh the page and try again.');
      }
      throw new Error('Failed to capture page content');
    }
    
    // Then submit to backend
    const submitResponse = await chrome.runtime.sendMessage({
      type: 'SUBMIT_HTML',
      html: pageResponse.html,
      url: pageResponse.url
    });
    
    if (!submitResponse) {
      throw new Error('No response from background script');
    }
    
    if (submitResponse.success) {
      appState.capturedContent = {
        type: 'full-page',
        html: pageResponse.html,
        url: pageResponse.url,
        title: pageResponse.title
      };
      
      showFullPagePreview({
        title: pageResponse.title,
        url: pageResponse.url
      });
      addLogEntry(`Full page captured: ${pageResponse.title}`);
    } else {
      throw new Error(submitResponse.error || 'Submission failed');
    }
  } catch (error) {
    console.error('Full page capture failed:', error);
    showError(`Capture failed: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Handle start element selection
async function handleStartSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    console.log('Sending START_SELECTION to tab:', tab.id);
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'START_SELECTION'
    });
    
    console.log('START_SELECTION response:', response);
    
    if (response && response.success) {
      updateSelectionMode(true);
      addLogEntry('Element selection mode started');
    } else {
      throw new Error(response?.error || 'Failed to start selection');
    }
  } catch (error) {
    console.error('Failed to start selection:', error);
    if (error.message.includes('Could not establish connection')) {
      showError('Content script not loaded. Please refresh the page and try again.');
    } else {
      showError(`Failed to start selection: ${error.message}`);
    }
  }
}

// Handle stop element selection
async function handleStopSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'STOP_SELECTION'
    });
    
    if (response.success) {
      updateSelectionMode(false);
      addLogEntry('Element selection mode stopped');
    } else {
      throw new Error(response.error || 'Failed to stop selection');
    }
  } catch (error) {
    console.error('Failed to stop selection:', error);
    showError(`Failed to stop selection: ${error.message}`);
  }
}

// Update selection mode UI
function updateSelectionMode(active) {
  appState.isSelectionMode = active;
  
  if (active) {
    elements.startSelectionBtn.style.display = 'none';
    elements.stopSelectionBtn.style.display = 'inline-block';
  } else {
    elements.startSelectionBtn.style.display = 'inline-block';
    elements.stopSelectionBtn.style.display = 'none';
  }
}

// Handle messages from content script and background
function handleMessage(message, sender, sendResponse) {
  console.log('Sidepanel received message:', message);
  
  switch (message.type) {
    case 'ELEMENT_SELECTED':
      handleElementSelected(message.element, message.url);
      break;
      
    case 'SELECTION_MODE_STARTED':
      updateSelectionMode(true);
      break;
      
    case 'SELECTION_MODE_STOPPED':
      updateSelectionMode(false);
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
}

// Handle element selection
function handleElementSelected(element, url) {
  appState.selectedElement = element;
  appState.capturedContent = {
    type: 'element',
    html: element.html,
    url: url,
    element: element
  };
  
  showElementPreview(element, url);
  updateSelectionMode(false);
  addLogEntry(`Element selected: ${element.tagName}`);
}

// Show full page preview
function showFullPagePreview(pageInfo) {
  elements.previewSection.style.display = 'block';
  elements.previewTitle.textContent = 'Full Page Capture';
  
  // Show page info
  elements.pageInfo.style.display = 'block';
  elements.pageTitle.textContent = pageInfo.title;
  elements.pageUrl.textContent = pageInfo.url;
  
  // Hide element info and visual preview
  elements.elementInfo.style.display = 'none';
  elements.visualPreview.style.display = 'none';
  
  // Show submit controls
  elements.submitControls.style.display = 'block';
}

// Show element preview
function showElementPreview(element, url) {
  elements.previewSection.style.display = 'block';
  elements.previewTitle.textContent = 'Selected Element';
  
  // Show element info
  elements.elementInfo.style.display = 'block';
  elements.elementTag.textContent = element.tagName.toLowerCase();
  elements.elementSelector.textContent = element.selector;
  elements.elementContent.textContent = element.textContent;
  
  // Show page info
  elements.pageInfo.style.display = 'block';
  elements.pageTitle.textContent = document.title;
  elements.pageUrl.textContent = url;
  
  // Hide visual preview for now (SnapDOM removed)
  elements.visualPreview.style.display = 'none';
  
  // Show submit controls
  elements.submitControls.style.display = 'block';
}

// Clear preview
function clearPreview() {
  elements.previewSection.style.display = 'none';
  appState.selectedElement = null;
  appState.capturedContent = null;
}

// Handle content submission
async function handleSubmitContent() {
  if (!appState.capturedContent) {
    showError('No content to submit');
    return;
  }
  
  showLoading('Submitting content to backend...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SUBMIT_HTML',
      html: appState.capturedContent.html,
      url: appState.capturedContent.url
    });
    
    if (response.success) {
      addLogEntry(`Content submitted successfully (ID: ${response.result.id})`);
      clearPreview();
      showSuccess('Content submitted successfully!');
    } else {
      throw new Error(response.error || 'Submission failed');
    }
  } catch (error) {
    console.error('Submission failed:', error);
    showError(`Submission failed: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Utility functions
function showLoading(message) {
  elements.loadingMessage.textContent = message;
  elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  elements.loadingOverlay.style.display = 'none';
}

function showError(message) {
  addLogEntry(message, 'error');
  // Could also show a toast notification here
}

function showSuccess(message) {
  addLogEntry(message, 'success');
  // Could also show a toast notification here
}

function addLogEntry(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="message">${message}</span>
  `;
  
  // Also log to console for debugging
  console.log(`[${type.toUpperCase()}] ${timestamp}: ${message}`);
  
  elements.activityLog.appendChild(entry);
  elements.activityLog.scrollTop = elements.activityLog.scrollHeight;
  
  // Keep only last 50 entries
  const entries = elements.activityLog.children;
  if (entries.length > 50) {
    elements.activityLog.removeChild(entries[0]);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}