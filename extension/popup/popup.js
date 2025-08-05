// Popup JavaScript for Social Media Research Assistant
// Simple popup that opens the main sidepanel interface

console.log('Popup script loaded');

// Initialize popup
function init() {
  const openPanelBtn = document.getElementById('open-panel-btn');
  openPanelBtn.addEventListener('click', openSidePanel);
  
  // Auto-open sidepanel and close popup for better UX
  openSidePanel();
}

// Open the sidepanel
async function openSidePanel() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Open sidepanel for current tab
    await chrome.sidePanel.open({ tabId: tab.id });
    
    // Close popup window
    window.close();
  } catch (error) {
    console.error('Failed to open sidepanel:', error);
    
    // Fallback: try to open sidepanel without specific tab
    try {
      await chrome.sidePanel.open({});
      window.close();
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      
      // Show error message to user
      showError('Failed to open sidepanel. Please try again.');
    }
  }
}

// Show error message
function showError(message) {
  const btn = document.getElementById('open-panel-btn');
  btn.textContent = 'Error - Try Again';
  btn.style.background = 'rgba(220, 53, 69, 0.8)';
  
  // Reset after 3 seconds
  setTimeout(() => {
    btn.textContent = 'Open Side Panel';
    btn.style.background = 'rgba(255, 255, 255, 0.2)';
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}