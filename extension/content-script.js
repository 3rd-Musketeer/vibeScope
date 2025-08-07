// Content Script for vibeScope  
// Handles DOM interaction, element selection, and visual highlighting

console.log('Content script loaded on:', window.location.href);

// State management
let isSelectionMode = false;
let selectedElement = null;
let highlightOverlay = null;
let selectionOverlay = null;
let throttleId = null;
let lastHighlightedElement = null;

// Create visual overlay for element highlighting
function createHighlightOverlay() {
  if (highlightOverlay) return highlightOverlay;
  
  const overlay = document.createElement('div');
  overlay.id = 'smra-highlight-overlay';
  overlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #007bff;
    background: rgba(0, 123, 255, 0.1);
    z-index: 999999;
    display: none;
  `;
  document.body.appendChild(overlay);
  highlightOverlay = overlay;
  return overlay;
}

// Create selection mode overlay with instructions
function createSelectionOverlay() {
  if (selectionOverlay) return selectionOverlay;
  
  const overlay = document.createElement('div');
  overlay.id = 'smra-selection-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 1000000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      user-select: none;
    ">
      🎯 Click on an element to select it for capture
      <button id="smra-cancel-selection" style="
        margin-left: 16px;
        background: #dc3545;
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">Cancel</button>
    </div>
  `;
  document.body.appendChild(overlay);
  selectionOverlay = overlay;
  
  // Add cancel button functionality
  const cancelBtn = overlay.querySelector('#smra-cancel-selection');
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopElementSelection();
  });
  
  return overlay;
}

// Get element position and dimensions
function getElementBounds(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  };
}

// Highlight element on hover (optimized with throttling)
function highlightElement(element) {
  if (!isSelectionMode || element === lastHighlightedElement) return;
  
  // Cancel previous animation frame if pending
  if (throttleId) {
    cancelAnimationFrame(throttleId);
  }
  
  // Throttle using requestAnimationFrame for smooth 60fps updates
  throttleId = requestAnimationFrame(() => {
    const overlay = createHighlightOverlay();
    const bounds = getElementBounds(element);
    
    // Batch style updates to avoid multiple reflows
    overlay.style.cssText += `
      display: block;
      top: ${bounds.top}px;
      left: ${bounds.left}px;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
    `;
    
    lastHighlightedElement = element;
    throttleId = null;
  });
}

// Hide highlight overlay
function hideHighlight() {
  if (throttleId) {
    cancelAnimationFrame(throttleId);
    throttleId = null;
  }
  if (highlightOverlay) {
    highlightOverlay.style.display = 'none';
  }
  lastHighlightedElement = null;
}

// Start element selection mode
function startElementSelection() {
  if (isSelectionMode) return;
  
  console.log('Starting element selection mode');
  isSelectionMode = true;
  selectedElement = null;
  
  // Create overlays
  createHighlightOverlay();
  createSelectionOverlay();
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  
  // Change cursor
  document.body.style.cursor = 'crosshair';
  
  // Notify sidepanel
  chrome.runtime.sendMessage({
    type: 'SELECTION_MODE_STARTED'
  });
}

// Stop element selection mode  
function stopElementSelection() {
  if (!isSelectionMode) return;
  
  console.log('Stopping element selection mode');
  isSelectionMode = false;
  
  // Cancel any pending animation frames
  if (throttleId) {
    cancelAnimationFrame(throttleId);
    throttleId = null;
  }
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  
  // Reset cursor
  document.body.style.cursor = '';
  
  // Clean up overlays
  hideHighlight();
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }
  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }
  
  // Reset state
  lastHighlightedElement = null;
  
  // Notify sidepanel
  chrome.runtime.sendMessage({
    type: 'SELECTION_MODE_STOPPED'
  });
}

// Handle mouse over events (optimized)
function handleMouseOver(event) {
  if (!isSelectionMode) return;
  
  // Skip our own overlays early
  if (event.target.id?.startsWith('smra-')) return;
  
  // Only prevent default if we're actually going to highlight
  event.preventDefault();
  event.stopPropagation();
  
  highlightElement(event.target);
}

// Handle mouse out events
function handleMouseOut(event) {
  if (!isSelectionMode) return;
  hideHighlight();
}

// Handle click events
async function handleClick(event) {
  if (!isSelectionMode) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Skip our own overlays
  if (event.target.id?.startsWith('smra-')) return;
  
  selectedElement = event.target;
  console.log('Element selected:', selectedElement);
  
  // Generate preview
  const preview = await generateElementPreview(selectedElement);
  
  // Get element info (optimized - limit HTML size)
  const outerHTML = selectedElement.outerHTML;
  const elementInfo = {
    tagName: selectedElement.tagName,
    id: selectedElement.id,
    className: selectedElement.className,
    textContent: selectedElement.textContent?.substring(0, 200) + '...',
    html: outerHTML.length > 50000 ? outerHTML.substring(0, 50000) + '...[truncated]' : outerHTML,
    selector: generateElementSelector(selectedElement),
    preview: preview?.preview || null,
    bounds: preview?.bounds || getElementBounds(selectedElement)
  };
  
  // Stop selection mode
  stopElementSelection();
  
  // Notify sidepanel with selection
  chrome.runtime.sendMessage({
    type: 'ELEMENT_SELECTED',
    element: elementInfo,
    url: window.location.href
  });
}

// Generate CSS selector for element
function generateElementSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  let selector = element.tagName.toLowerCase();
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }
  
  // Add nth-child if needed for uniqueness
  const siblings = Array.from(element.parentNode?.children || []);
  const index = siblings.indexOf(element);
  if (index > 0) {
    selector += `:nth-child(${index + 1})`;
  }
  
  return selector;
}

// Generate simple element info (no visual preview for now)
async function generateElementPreview(element) {
  try {
    console.log('Generating element info (no visual preview)');
    
    return {
      preview: null, // No visual preview for now
      bounds: getElementBounds(element)
    };
  } catch (error) {
    console.error('Failed to generate element info:', error);
    return {
      preview: null,
      bounds: getElementBounds(element)
    };
  }
}

// Handle messages from background script and sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'START_SELECTION':
      startElementSelection();
      sendResponse({ success: true });
      break;
      
    case 'STOP_SELECTION':
      stopElementSelection();
      sendResponse({ success: true });
      break;
      
    case 'GET_FULL_PAGE_HTML':
      sendResponse({
        success: true,
        html: document.documentElement.outerHTML,
        url: window.location.href,
        title: document.title
      });
      break;
      
    case 'GET_SELECTED_ELEMENT':
      if (selectedElement) {
        sendResponse({
          success: true,
          html: selectedElement.outerHTML,
          selector: generateElementSelector(selectedElement)
        });
      } else {
        sendResponse({ success: false, error: 'No element selected' });
      }
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Clean up on page unload  
window.addEventListener('beforeunload', () => {
  stopElementSelection();
  // Force cleanup of any remaining resources
  if (throttleId) {
    cancelAnimationFrame(throttleId);
    throttleId = null;
  }
});

console.log('Content script initialized');