/**
 * SatyaTrail Chrome Extension - Background Service Worker
 * 
 * Handles background tasks, context menus, and notifications.
 */

const DEFAULT_API_URL = 'http://localhost:3001';

// Install event - setup context menus
chrome.runtime.onInstalled.addListener(() => {
  console.log('🛡️ SatyaTrail extension installed');
  
  // Create context menu for selected text
  chrome.contextMenus.create({
    id: 'satyatrail-verify',
    title: 'Verify with SatyaTrail',
    contexts: ['selection']
  });
  
  // Create context menu for page
  chrome.contextMenus.create({
    id: 'satyatrail-verify-page',
    title: 'Verify this page',
    contexts: ['page']
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'satyatrail-verify') {
    // Verify selected text
    const selectedText = info.selectionText;
    if (selectedText && selectedText.length >= 10) {
      await quickVerifyText(selectedText, tab);
    } else {
      showNotification('Selection too short', 'Please select at least 10 characters to verify.');
    }
  }
  
  if (info.menuItemId === 'satyatrail-verify-page') {
    // Open popup to verify page
    // Note: Can't programmatically open popup, but can trigger via message
    chrome.action.openPopup();
  }
});

/**
 * Quick verify selected text
 */
async function quickVerifyText(text, tab) {
  try {
    const settings = await getSettings();
    
    // Show loading notification
    showNotification('Verifying...', 'Checking the selected text...');
    
    const response = await fetch(`${settings.apiUrl}/api/v1/verify/extension/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        url: tab.url
      })
    });
    
    if (!response.ok) {
      throw new Error('Verification failed');
    }
    
    const result = await response.json();
    
    // Show result notification
    const verdictEmoji = {
      'True': '✅',
      'False': '❌',
      'Misleading': '⚠️',
      'Unverifiable': '❓'
    };
    
    showNotification(
      `${verdictEmoji[result.verdict] || '❓'} ${result.verdict}`,
      result.reason
    );
    
    // Highlight on page with full result
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'highlightResults',
        result: {
          overall_verdict: result.verdict,
          confidence_score: result.confidence_score,
          claim_verdicts: [{
            claim: text,
            verdict: result.verdict,
            confidence: result.confidence_score,
            evidence_summary: result.reason
          }],
          suggested_corrections: []
        }
      });
    } catch (e) {
      console.log('Could not highlight:', e);
    }
    
  } catch (error) {
    console.error('Quick verify failed:', error);
    showNotification('Verification Failed', 'Unable to verify the selected text.');
  }
}

/**
 * Get settings from storage
 */
async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get({
      apiUrl: DEFAULT_API_URL,
      autoVerify: false,
      showNotifications: true
    }, resolve);
  });
}

/**
 * Show notification
 */
async function showNotification(title, message) {
  const settings = await getSettings();
  
  if (!settings.showNotifications) return;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `SatyaTrail: ${title}`,
    message: message,
    priority: 1
  });
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'verifyPage') {
    // Handle full page verification request
    handlePageVerification(message.tabId)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'getApiUrl') {
    getSettings().then(settings => sendResponse({ apiUrl: settings.apiUrl }));
    return true;
  }
});

/**
 * Handle full page verification
 */
async function handlePageVerification(tabId) {
  // Extract content
  const [{ result: content }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (window.SatyaTrail) {
        return window.SatyaTrail.extractContent();
      }
      return null;
    }
  });
  
  if (!content) {
    throw new Error('Failed to extract page content');
  }
  
  // Get settings
  const settings = await getSettings();
  
  // Call API
  const response = await fetch(`${settings.apiUrl}/api/v1/verify/extension/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      domContent: content.text,
      url: content.url,
      title: content.metadata?.title,
      metadata: content.metadata
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Verification failed');
  }
  
  return await response.json();
}

// Badge text for verified pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  
  // Check if we have a stored result for this URL
  const key = `result_${btoa(tab.url).substring(0, 20)}`;
  
  chrome.storage.local.get(key, (data) => {
    if (data[key]) {
      const result = data[key].result;
      const verdict = result.overall_verdict?.toLowerCase();
      
      // Set badge based on verdict
      const badges = {
        'true': { text: '✓', color: '#10b981' },
        'false': { text: '✗', color: '#ef4444' },
        'misleading': { text: '!', color: '#f59e0b' }
      };
      
      const badge = badges[verdict];
      if (badge) {
        chrome.action.setBadgeText({ tabId, text: badge.text });
        chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });
      }
    } else {
      // Clear badge
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  });
});

console.log('🛡️ SatyaTrail background service worker started');

