// Debug script to test extension functionality
// Run this in the browser console to diagnose issues

console.log('🔍 Extension Debug Tool Started');

async function debugExtension() {
  console.log('=== Extension Debug Information ===');
  
  // 1. Check if extension is installed
  try {
    const extensionId = chrome.runtime.id;
    console.log('✅ Extension ID:', extensionId);
  } catch (error) {
    console.error('❌ Extension not accessible:', error);
    return;
  }
  
  // 2. Test runtime connection
  try {
    const response = await chrome.runtime.sendMessage({type: 'GET_CONFIG'});
    console.log('✅ Background script responding:', response);
  } catch (error) {
    console.error('❌ Background script not responding:', error);
  }
  
  // 3. Check current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('✅ Current tab:', {
      id: tab.id,
      url: tab.url,
      title: tab.title
    });
    
    // 4. Test content script
    try {
      const contentResponse = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_FULL_PAGE_HTML'
      });
      console.log('✅ Content script responding:', {
        success: contentResponse.success,
        htmlLength: contentResponse.html?.length,
        title: contentResponse.title
      });
    } catch (error) {
      console.error('❌ Content script not responding:', error);
      console.log('💡 Try refreshing the page and running this again');
    }
    
  } catch (error) {
    console.error('❌ Tab query failed:', error);
  }
  
  // 5. Check storage
  try {
    const storage = await chrome.storage.local.get();
    console.log('✅ Extension storage:', storage);
  } catch (error) {
    console.error('❌ Storage access failed:', error);
  }
  
  console.log('=== Debug Complete ===');
}

// Auto-run debug
debugExtension();

// Export for manual use
window.debugExtension = debugExtension;