// Background Service Worker - Minimal functionality for API communication
console.log('Background service worker loaded');

// Submit HTML content to backend
async function submitContent(htmlContent, url = null) {
  try {
    // Load config from storage
    const storage = await chrome.storage.local.get(['config']);
    const config = storage.config;
    
    if (!config) {
      throw new Error('No project configuration found');
    }
    
    const requestBody = {
      project_id: config.projectId,
      html: htmlContent
    };
    
    if (url) {
      requestBody.url = url;
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth header for non-localhost
    if (!config.backendUrl.includes('localhost')) {
      headers['Authorization'] = `Bearer ${config.sessionToken}`;
    }
    
    const response = await fetch(`${config.backendUrl}/tasks`, {
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

// Handle messages from popup and sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'SUBMIT_HTML') {
    handleSubmitHtml(message.html, message.url, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  console.warn('Unknown message type:', message.type);
  sendResponse({ success: false, error: 'Unknown message type' });
});

// Handle HTML submission
async function handleSubmitHtml(html, url, sendResponse) {
  try {
    if (!html) {
      throw new Error('No HTML content provided');
    }
    
    const result = await submitContent(html, url);
    sendResponse({ success: true, result });
  } catch (error) {
    console.error('HTML submission failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
});

console.log('Background service worker started');