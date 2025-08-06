// Sidepanel JavaScript - Simplified capture interface
console.log('Sidepanel script loaded');

let currentConfig = null;
let capturedData = null;
let isSelectionMode = false;

// Initialize sidepanel
function init() {
  loadConfig();
  setupEventListeners();
}

// Load configuration from storage
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get(['config']);
    if (result.config) {
      currentConfig = result.config;
      setStatus('Ready to capture content. If capture fails, refresh the page first.');
    } else {
      setStatus('No project configuration found. Use the popup to connect first.');
      document.getElementById('status-dot').className = 'status-dot error';
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    setStatus('Configuration error');
    document.getElementById('status-dot').className = 'status-dot error';
  }
}

// Setup event listeners with delegation
function setupEventListeners() {
  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Handle all click events
function handleClick(e) {
  if (e.target.id === 'capture-btn') {
    handleCapture();
  } else if (e.target.id === 'submit-btn') {
    handleSubmit();
  }
}

// Handle radio button changes
function handleChange(e) {
  if (e.target.name === 'capture-method') {
    updateCaptureButton(e.target.value);
    
    // If switching from element selection mode, stop it
    if (isSelectionMode && e.target.value === 'full-page') {
      stopElementSelection();
    }
  }
}

// Update capture button based on selected method
function updateCaptureButton(method) {
  const button = document.getElementById('capture-btn');
  
  if (method === 'full-page') {
    button.innerHTML = '📸 Capture Full Page';
  } else {
    button.innerHTML = isSelectionMode ? '❌ Stop Selection' : '🎯 Start Element Selection';
  }
}

// Handle capture action
async function handleCapture() {
  const method = document.querySelector('input[name="capture-method"]:checked').value;
  
  if (method === 'full-page') {
    await captureFullPage();
  } else {
    if (isSelectionMode) {
      stopElementSelection();
    } else {
      startElementSelection();
    }
  }
}

// Capture full page
async function captureFullPage() {
  if (!currentConfig) {
    setStatus('No project configuration available');
    return;
  }
  
  try {
    setStatus('Capturing full page...');
    disableCaptureButton(true);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    // Check if content script is ready
    setStatus('Checking content script...');
    
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_FULL_PAGE_HTML'
      });
    } catch (connectionError) {
      // Content script not loaded - try to inject it
      console.log('Content script not responding, attempting injection...');
      setStatus('Injecting content script...');
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        // Wait a bit for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try again
        response = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_FULL_PAGE_HTML'
        });
      } catch (injectionError) {
        console.error('Content script injection failed:', injectionError);
        throw new Error('Cannot access this page. Try refreshing the page and ensure it\'s not a chrome:// or extension:// page.');
      }
    }
    
    if (!response || !response.success) {
      throw new Error('Content script failed to capture page content');
    }
    
    capturedData = {
      type: 'full-page',
      html: response.html,
      url: response.url,
      title: response.title
    };
    
    showPreview();
    setStatus('Full page captured successfully');
    
  } catch (error) {
    console.error('Capture failed:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('Could not establish connection')) {
      errorMessage = 'Content script not loaded. Please refresh the page and try again.';
    } else if (error.message.includes('Cannot access')) {
      errorMessage = 'Cannot access this page type. Try navigating to a regular website.';
    }
    
    setStatus('Capture failed: ' + errorMessage);
  } finally {
    disableCaptureButton(false);
  }
}

// Start element selection
async function startElementSelection() {
  try {
    setStatus('Starting element selection...');
    disableCaptureButton(true);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        type: 'START_SELECTION'
      });
    } catch (connectionError) {
      // Content script not loaded - try to inject it
      console.log('Content script not responding, attempting injection...');
      setStatus('Injecting content script...');
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try again
        response = await chrome.tabs.sendMessage(tab.id, {
          type: 'START_SELECTION'
        });
      } catch (injectionError) {
        console.error('Content script injection failed:', injectionError);
        throw new Error('Cannot access this page. Try refreshing the page and ensure it\'s not a chrome:// or extension:// page.');
      }
    }
    
    if (response && response.success) {
      isSelectionMode = true;
      updateCaptureButton('element-select');
      setStatus('Click on an element to select it');
    } else {
      throw new Error('Failed to start selection mode');
    }
    
  } catch (error) {
    console.error('Selection start failed:', error);
    
    let errorMessage = error.message;
    if (error.message.includes('Could not establish connection')) {
      errorMessage = 'Content script not loaded. Please refresh the page and try again.';
    } else if (error.message.includes('Cannot access')) {
      errorMessage = 'Cannot access this page type. Try navigating to a regular website.';
    }
    
    setStatus('Failed to start selection: ' + errorMessage);
  } finally {
    disableCaptureButton(false);
  }
}

// Stop element selection
async function stopElementSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.tabs.sendMessage(tab.id, {
      type: 'STOP_SELECTION'
    });
    
    isSelectionMode = false;
    updateCaptureButton('element-select');
    setStatus('Element selection stopped');
    
  } catch (error) {
    console.error('Failed to stop selection:', error);
    setStatus('Failed to stop selection');
  }
}

// Handle messages from content script
function handleMessage(message, sender, sendResponse) {
  console.log('Sidepanel received message:', message);
  
  if (message.type === 'ELEMENT_SELECTED') {
    handleElementSelected(message.element, message.url);
  }
}

// Handle element selection
function handleElementSelected(element, url) {
  capturedData = {
    type: 'element',
    html: element.html,
    url: url,
    title: document.title,
    element: {
      tagName: element.tagName,
      selector: element.selector,
      textContent: element.textContent
    }
  };
  
  isSelectionMode = false;
  updateCaptureButton('element-select');
  showPreview();
  setStatus('Element captured successfully');
}

// Show preview of captured content
function showPreview() {
  const previewSection = document.getElementById('preview-section');
  const previewContent = document.getElementById('preview-content');
  const previewMeta = document.getElementById('preview-meta');
  const submitButton = document.getElementById('submit-btn');
  
  // Show preview section
  previewSection.style.display = 'block';
  
  // Update preview content
  if (capturedData.type === 'full-page') {
    previewContent.innerHTML = `
      <div class="text-sm">
        <div class="font-medium text-success">✓ Full page captured</div>
        <div class="text-xs text-muted">${formatSize(capturedData.html.length)} of HTML content</div>
      </div>
    `;
  } else {
    previewContent.innerHTML = `
      <div class="text-sm">
        <div class="font-medium text-success">✓ Element captured</div>
        <div class="text-xs text-muted">
          ${capturedData.element.tagName.toLowerCase()}: ${capturedData.element.textContent?.substring(0, 50)}...
        </div>
      </div>
    `;
  }
  
  // Update metadata
  document.getElementById('page-title').textContent = capturedData.title;
  document.getElementById('page-url').textContent = capturedData.url;
  document.getElementById('content-size').textContent = formatSize(capturedData.html.length);
  previewMeta.style.display = 'block';
  
  // Enable submit button
  submitButton.disabled = false;
}

// Handle submit to server
async function handleSubmit() {
  if (!capturedData || !currentConfig) {
    setStatus('No content to submit');
    return;
  }
  
  try {
    setStatus('Submitting to server...');
    document.getElementById('submit-btn').disabled = true;
    
    const response = await chrome.runtime.sendMessage({
      type: 'SUBMIT_HTML',
      html: capturedData.html,
      url: capturedData.url
    });
    
    if (response && response.success) {
      setStatus('✓ Content submitted successfully');
      clearPreview();
    } else {
      throw new Error(response?.error || 'Submission failed');
    }
    
  } catch (error) {
    console.error('Submit failed:', error);
    setStatus('Submit failed: ' + error.message);
  } finally {
    document.getElementById('submit-btn').disabled = false;
  }
}

// Clear preview
function clearPreview() {
  document.getElementById('preview-section').style.display = 'none';
  capturedData = null;
}

// Utility functions
function setStatus(message) {
  document.getElementById('status-text').textContent = message;
  console.log('Status:', message);
}

function disableCaptureButton(disabled) {
  document.getElementById('capture-btn').disabled = disabled;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes / (1024 * 1024)) + ' MB';
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}