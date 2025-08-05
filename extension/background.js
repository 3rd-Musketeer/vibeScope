// Background Service Worker for Social Media Research Assistant
// Handles API communication and message passing between components

console.log('Background service worker loaded');

// State management
let currentConfig = null;

// Parse project-key (base64 encoded: backend_url + project_id + session_token)
function parseProjectKey(projectKey) {
  try {
    const decoded = atob(projectKey);
    const parts = decoded.split('|');
    
    if (parts.length !== 3) {
      throw new Error('Invalid project key format');
    }
    
    return {
      backendUrl: parts[0],
      projectId: parts[1],
      sessionToken: parts[2]
    };
  } catch (error) {
    console.error('Failed to parse project key:', error);
    return null;
  }
}

// Validate project configuration with backend
async function validateConfig(config) {
  try {
    // For mock server, we don't use Authorization header
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only add auth header if not localhost (mock server)
    if (!config.backendUrl.includes('localhost')) {
      headers['Authorization'] = `Bearer ${config.sessionToken}`;
    }
    
    const response = await fetch(`${config.backendUrl}/projects`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const projects = await response.json();
    const projectExists = projects.some(p => p.id === config.projectId);
    
    if (!projectExists) {
      throw new Error('Project not found');
    }
    
    return true;
  } catch (error) {
    console.error('Config validation failed:', error);
    return false;
  }
}

// Submit HTML content to backend
async function submitContent(htmlContent, url = null) {
  if (!currentConfig) {
    throw new Error('No project configuration set');
  }
  
  const requestBody = {
    project_id: currentConfig.projectId,
    html: htmlContent
  };
  
  if (url) {
    requestBody.url = url;
  }
  
  try {
    // For mock server, we don't use Authorization header
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only add auth header if not localhost (mock server)
    if (!currentConfig.backendUrl.includes('localhost')) {
      headers['Authorization'] = `Bearer ${currentConfig.sessionToken}`;
    }
    
    const response = await fetch(`${currentConfig.backendUrl}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Content submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to submit content:', error);
    throw error;
  }
}

// Handle messages from content script and sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  try {
    switch (message.type) {
      case 'SET_PROJECT_KEY':
        handleSetProjectKey(message.projectKey, sendResponse);
        return true; // Keep message channel open for async response
        
      case 'GET_CONFIG':
        sendResponse({ config: currentConfig });
        break;
        
      case 'SUBMIT_HTML':
        handleSubmitHtml(message.html, message.url, sendResponse);
        return true; // Keep message channel open for async response
        
      case 'CAPTURE_FULL_PAGE':
        handleFullPageCapture(sender?.tab?.id, sendResponse);
        return true; // Keep message channel open for async response
        
      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// Handle project key setup
async function handleSetProjectKey(projectKey, sendResponse) {
  try {
    const config = parseProjectKey(projectKey);
    if (!config) {
      sendResponse({ success: false, error: 'Invalid project key format' });
      return;
    }
    
    // For MVP, skip backend validation and use mock server
    const isValid = await validateConfig(config);
    if (!isValid) {
      // For MVP, still set config even if validation fails (mock server)
      console.warn('Config validation failed, but continuing for MVP');
    }
    
    currentConfig = config;
    
    // Store in extension storage for persistence
    await chrome.storage.local.set({ projectKey, config });
    
    sendResponse({ success: true, config });
  } catch (error) {
    console.error('Error setting project key:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle HTML submission
async function handleSubmitHtml(html, url, sendResponse) {
  try {
    console.log('Submitting HTML content:', { htmlLength: html?.length, url });
    
    if (!html) {
      throw new Error('No HTML content provided');
    }
    
    if (!currentConfig) {
      throw new Error('No project configuration set. Please connect first.');
    }
    
    const result = await submitContent(html, url);
    console.log('Submission result:', result);
    sendResponse({ success: true, result });
  } catch (error) {
    console.error('HTML submission failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle full page capture (legacy - keeping for compatibility)
async function handleFullPageCapture(tabId, sendResponse) {
  try {
    // Inject script to get full page HTML
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return {
          html: document.documentElement.outerHTML,
          url: window.location.href,
          title: document.title
        };
      }
    });
    
    if (results && results[0] && results[0].result) {
      const pageData = results[0].result;
      const result = await submitContent(pageData.html, pageData.url);
      sendResponse({ 
        success: true, 
        result,
        pageInfo: {
          title: pageData.title,
          url: pageData.url
        }
      });
    } else {
      throw new Error('Failed to capture page content');
    }
  } catch (error) {
    console.error('Full page capture failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Load saved configuration on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const stored = await chrome.storage.local.get(['config']);
    if (stored.config) {
      currentConfig = stored.config;
      console.log('Restored configuration from storage');
    }
  } catch (error) {
    console.error('Failed to restore configuration:', error);
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Social Media Research Assistant installed');
  
  // Load saved config on install as well
  try {
    const stored = await chrome.storage.local.get(['config']);
    if (stored.config) {
      currentConfig = stored.config;
      console.log('Restored configuration on install');
    }
  } catch (error) {
    console.error('Failed to restore configuration on install:', error);
  }
});

// Ensure service worker stays alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
});

// Log when service worker starts
console.log('Background service worker started');