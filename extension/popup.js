/**
 * SatyaTrail Chrome Extension - Popup Script
 * 
 * Enhanced with color-coded highlights and interactive tooltips.
 */

// Default API URL
const DEFAULT_API_URL = 'http://localhost:3001';

// State
let currentState = 'initial';
let verificationResult = null;
let activeTooltipElement = null;

// DOM Elements
const elements = {
  // States
  initialState: document.getElementById('initialState'),
  loadingState: document.getElementById('loadingState'),
  resultsState: document.getElementById('resultsState'),
  errorState: document.getElementById('errorState'),
  
  // Page info
  pageTitle: document.getElementById('pageTitle'),
  pageUrl: document.getElementById('pageUrl'),
  pageFavicon: document.getElementById('pageFavicon'),
  
  // Buttons
  verifyBtn: document.getElementById('verifyBtn'),
  quickVerifyBtn: document.getElementById('quickVerifyBtn'),
  newVerifyBtn: document.getElementById('newVerifyBtn'),
  shareBtn: document.getElementById('shareBtn'),
  retryBtn: document.getElementById('retryBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  
  // Loading
  loaderText: document.getElementById('loaderText'),
  steps: {
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    step4: document.getElementById('step4')
  },
  
  // Results
  verdictContainer: document.getElementById('verdictContainer'),
  verdictBadge: document.getElementById('verdictBadge'),
  verdictIcon: document.getElementById('verdictIcon'),
  verdictText: document.getElementById('verdictText'),
  confidenceFill: document.getElementById('confidenceFill'),
  confidenceScore: document.getElementById('confidenceScore'),
  summaryText: document.getElementById('summaryText'),
  metadataSection: document.getElementById('metadataSection'),
  metadataGrid: document.getElementById('metadataGrid'),
  claimsCount: document.getElementById('claimsCount'),
  claimsList: document.getElementById('claimsList'),
  correctionsSection: document.getElementById('correctionsSection'),
  correctionsList: document.getElementById('correctionsList'),
  evidenceCount: document.getElementById('evidenceCount'),
  evidenceList: document.getElementById('evidenceList'),
  recommendationCard: document.getElementById('recommendationCard'),
  recommendationText: document.getElementById('recommendationText'),
  processingTime: document.getElementById('processingTime'),
  
  // Tooltip
  tooltipContainer: document.getElementById('tooltipContainer'),
  tooltipIcon: document.getElementById('tooltipIcon'),
  tooltipTitle: document.getElementById('tooltipTitle'),
  tooltipContent: document.getElementById('tooltipContent'),
  tooltipConfidence: document.getElementById('tooltipConfidence'),
  tooltipConfidenceFill: document.getElementById('tooltipConfidenceFill'),
  tooltipConfidenceValue: document.getElementById('tooltipConfidenceValue'),
  tooltipSources: document.getElementById('tooltipSources'),
  tooltipSourcesList: document.getElementById('tooltipSourcesList'),
  tooltipArrow: document.getElementById('tooltipArrow'),
  
  // Error
  errorMessage: document.getElementById('errorMessage'),
  
  // Settings
  settingsModal: document.getElementById('settingsModal'),
  apiUrl: document.getElementById('apiUrl'),
  autoVerify: document.getElementById('autoVerify'),
  showNotifications: document.getElementById('showNotifications')
};

// Tooltip data storage
const tooltipDataMap = new Map();

/**
 * Initialize the popup
 */
async function init() {
  await loadSettings();
  
  const tab = await getCurrentTab();
  if (tab) {
    displayPageInfo(tab);
  }
  
  setupEventListeners();
  setupTooltipSystem();
}

/**
 * Get current active tab
 */
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Display page information
 */
function displayPageInfo(tab) {
  elements.pageTitle.textContent = tab.title || 'Unknown Page';
  elements.pageUrl.textContent = new URL(tab.url).hostname;
  
  if (tab.favIconUrl) {
    elements.pageFavicon.innerHTML = `<img src="${tab.favIconUrl}" alt="favicon">`;
  } else {
    elements.pageFavicon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; color: #71717a;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    `;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  elements.verifyBtn.addEventListener('click', handleVerify);
  elements.quickVerifyBtn.addEventListener('click', handleQuickVerify);
  elements.newVerifyBtn.addEventListener('click', handleNewVerify);
  elements.shareBtn.addEventListener('click', handleShare);
  elements.retryBtn.addEventListener('click', handleVerify);
  elements.settingsBtn.addEventListener('click', () => toggleModal(true));
  elements.closeSettingsBtn.addEventListener('click', () => toggleModal(false));
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Close tooltip when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.highlight-item') && !e.target.closest('.tooltip-container')) {
      hideTooltip();
    }
  });
}

/**
 * Setup tooltip system
 */
function setupTooltipSystem() {
  // Handle hover and click on highlighted items
  document.addEventListener('mouseenter', handleTooltipShow, true);
  document.addEventListener('mouseleave', handleTooltipHide, true);
  document.addEventListener('click', handleTooltipClick, true);
}

/**
 * Handle tooltip show on hover
 */
function handleTooltipShow(e) {
  const highlightItem = e.target.closest('.highlight-item');
  if (highlightItem && highlightItem.dataset.tooltipId) {
    showTooltip(highlightItem);
  }
}

/**
 * Handle tooltip hide on mouse leave
 */
function handleTooltipHide(e) {
  const highlightItem = e.target.closest('.highlight-item');
  if (highlightItem) {
    // Delay hide to allow moving to tooltip
    setTimeout(() => {
      if (!elements.tooltipContainer.matches(':hover') && 
          !document.querySelector('.highlight-item:hover')) {
        hideTooltip();
      }
    }, 100);
  }
}

/**
 * Handle tooltip click (for mobile/touch)
 */
function handleTooltipClick(e) {
  const highlightItem = e.target.closest('.highlight-item');
  if (highlightItem && highlightItem.dataset.tooltipId) {
    e.preventDefault();
    if (activeTooltipElement === highlightItem) {
      hideTooltip();
    } else {
      showTooltip(highlightItem);
    }
  }
}

/**
 * Show tooltip for element
 */
function showTooltip(element) {
  const tooltipId = element.dataset.tooltipId;
  const data = tooltipDataMap.get(tooltipId);
  
  if (!data) return;
  
  activeTooltipElement = element;
  
  // Set tooltip content
  elements.tooltipIcon.className = `tooltip-icon ${data.type}`;
  elements.tooltipIcon.innerHTML = getTooltipIconSVG(data.type);
  elements.tooltipTitle.textContent = data.title;
  elements.tooltipContent.innerHTML = data.content;
  
  // Confidence bar
  if (data.confidence !== undefined) {
    elements.tooltipConfidence.style.display = 'flex';
    elements.tooltipConfidenceFill.style.width = `${data.confidence}%`;
    elements.tooltipConfidenceFill.style.background = getConfidenceColor(data.confidence);
    elements.tooltipConfidenceValue.textContent = `${data.confidence}%`;
  } else {
    elements.tooltipConfidence.style.display = 'none';
  }
  
  // Sources
  if (data.sources && data.sources.length > 0) {
    elements.tooltipSources.style.display = 'block';
    elements.tooltipSourcesList.innerHTML = data.sources.map(src => 
      `<a href="${src}" target="_blank" class="tooltip-source-link">${getDomainFromUrl(src)}</a>`
    ).join('');
  } else {
    elements.tooltipSources.style.display = 'none';
  }
  
  // Position tooltip
  positionTooltip(element);
  
  // Show tooltip
  elements.tooltipContainer.classList.add('visible');
}

/**
 * Hide tooltip
 */
function hideTooltip() {
  elements.tooltipContainer.classList.remove('visible');
  activeTooltipElement = null;
}

/**
 * Position tooltip relative to element
 */
function positionTooltip(element) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = elements.tooltipContainer.getBoundingClientRect();
  const containerRect = document.querySelector('.main').getBoundingClientRect();
  
  let top = rect.top - 10;
  let left = rect.left + (rect.width / 2);
  
  // Default: show above
  let arrowPosition = 'bottom';
  
  // Check if tooltip would go above viewport
  if (top - tooltipRect.height < containerRect.top) {
    top = rect.bottom + 10;
    arrowPosition = 'top';
  } else {
    top = top - tooltipRect.height;
  }
  
  // Horizontal centering with bounds check
  left = Math.max(10, Math.min(left - (tooltipRect.width / 2), containerRect.right - tooltipRect.width - 10));
  
  elements.tooltipContainer.style.top = `${top}px`;
  elements.tooltipContainer.style.left = `${left}px`;
  
  // Position arrow
  elements.tooltipArrow.className = `tooltip-arrow ${arrowPosition}`;
}

/**
 * Get SVG icon for tooltip type
 */
function getTooltipIconSVG(type) {
  const icons = {
    claim: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    evidence: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    source: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    metadata: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    correction: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[type] || icons.claim}</svg>`;
}

/**
 * Get confidence color
 */
function getConfidenceColor(confidence) {
  if (confidence >= 70) return 'linear-gradient(90deg, #22c55e, #4ade80)';
  if (confidence >= 40) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  return 'linear-gradient(90deg, #ef4444, #f87171)';
}

/**
 * Get domain from URL
 */
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Switch between states
 */
function switchState(state) {
  currentState = state;
  
  elements.initialState.classList.add('hidden');
  elements.loadingState.classList.add('hidden');
  elements.resultsState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  
  switch (state) {
    case 'initial':
      elements.initialState.classList.remove('hidden');
      break;
    case 'loading':
      elements.loadingState.classList.remove('hidden');
      resetProgress();
      break;
    case 'results':
      elements.resultsState.classList.remove('hidden');
      break;
    case 'error':
      elements.errorState.classList.remove('hidden');
      break;
  }
}

/**
 * Reset progress steps
 */
function resetProgress() {
  Object.values(elements.steps).forEach(step => {
    step.classList.remove('active', 'completed');
  });
}

/**
 * Update progress step
 */
function updateProgress(stepNum, status) {
  const step = elements.steps[`step${stepNum}`];
  if (!step) return;
  
  step.classList.remove('active', 'completed');
  if (status === 'active') {
    step.classList.add('active');
  } else if (status === 'completed') {
    step.classList.add('completed');
  }
}

/**
 * Handle main verification
 */
async function handleVerify() {
  switchState('loading');
  tooltipDataMap.clear();
  
  try {
    updateProgress(1, 'active');
    elements.loaderText.textContent = 'Extracting page content...';
    
    const tab = await getCurrentTab();
    const domContent = await extractDOMContent(tab.id);
    
    updateProgress(1, 'completed');
    updateProgress(2, 'active');
    elements.loaderText.textContent = 'Analyzing with AI...';
    
    updateProgress(2, 'completed');
    updateProgress(3, 'active');
    elements.loaderText.textContent = 'Fact-checking claims...';
    
    const settings = await getSettings();
    const response = await fetch(`${settings.apiUrl}/api/v1/verify/extension/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domContent,
        url: tab.url,
        title: tab.title
      })
    });
    
    updateProgress(3, 'completed');
    updateProgress(4, 'active');
    elements.loaderText.textContent = 'Generating verdict...';
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Verification failed');
    }
    
    const result = await response.json();
    
    updateProgress(4, 'completed');
    await sleep(400);
    
    verificationResult = result;
    displayResults(result);
    switchState('results');
    
    // Send results to content script for webpage highlighting
    await highlightOnPage(tab.id, result);
    
    await storeResult(tab.url, result);
    
  } catch (error) {
    console.error('Verification failed:', error);
    elements.errorMessage.textContent = error.message || 'An error occurred during verification.';
    switchState('error');
  }
}

/**
 * Handle quick verification
 */
async function handleQuickVerify() {
  try {
    const tab = await getCurrentTab();
    
    const [{ result: selectedText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });
    
    if (!selectedText || selectedText.trim().length < 10) {
      alert('Please select some text on the page first (at least 10 characters).');
      return;
    }
    
    switchState('loading');
    tooltipDataMap.clear();
    elements.loaderText.textContent = 'Quick checking selected text...';
    updateProgress(1, 'completed');
    updateProgress(2, 'active');
    
    const settings = await getSettings();
    const response = await fetch(`${settings.apiUrl}/api/v1/verify/extension/quick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: selectedText, url: tab.url })
    });
    
    updateProgress(2, 'completed');
    updateProgress(3, 'completed');
    updateProgress(4, 'completed');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Quick verification failed');
    }
    
    const result = await response.json();
    
    verificationResult = {
      overall_verdict: result.verdict,
      confidence_score: result.confidence_score,
      page_summary: `Quick check of selected text: "${selectedText.substring(0, 100)}..."`,
      page_metadata: { content_type: 'selected_text', topic: 'Quick Check' },
      claim_verdicts: [{
        claim: selectedText,
        verdict: result.verdict,
        confidence: result.confidence_score,
        evidence_summary: result.reason
      }],
      misinformation_detected: result.verdict === 'False' || result.verdict === 'Misleading',
      suggested_corrections: [],
      supporting_evidence: [],
      summary: result.reason,
      recommendation: result.verdict === 'True' ? 'This statement appears to be accurate.' : 
                      result.verdict === 'False' ? 'This statement may contain misinformation.' :
                      'This statement requires further verification.',
      processing_time_ms: result.processing_time_ms
    };
    
    displayResults(verificationResult);
    switchState('results');
    
    // Highlight on page
    await highlightOnPage(tab.id, verificationResult);
    
  } catch (error) {
    console.error('Quick verification failed:', error);
    elements.errorMessage.textContent = error.message || 'Quick verification failed.';
    switchState('error');
  }
}

/**
 * Extract DOM content from tab
 */
async function extractDOMContent(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const clone = document.body.cloneNode(true);
      const removeSelectors = ['script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'header', 'aside', '.ad', '.advertisement', '.sidebar'];
      removeSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });
      let text = clone.innerText || clone.textContent;
      text = text.replace(/\s+/g, ' ').trim();
      return text.substring(0, 50000);
    }
  });
  return result;
}

/**
 * Display verification results with enhanced highlights
 */
function displayResults(result) {
  // Clear previous tooltip data
  tooltipDataMap.clear();
  
  // Verdict
  const verdictClass = getVerdictClass(result.overall_verdict);
  elements.verdictContainer.className = `verdict-container ${verdictClass}`;
  elements.verdictBadge.className = `verdict-badge ${verdictClass}`;
  elements.verdictText.textContent = result.overall_verdict;
  elements.verdictIcon.innerHTML = getVerdictIconSVG(result.overall_verdict);
  
  // Add tooltip for verdict
  const verdictTooltipId = 'verdict-main';
  elements.verdictBadge.dataset.tooltipId = verdictTooltipId;
  tooltipDataMap.set(verdictTooltipId, {
    type: 'claim',
    title: `Overall Verdict: ${result.overall_verdict}`,
    content: `<p><strong>Analysis Complete</strong></p><p>${result.summary || 'The page has been analyzed for factual accuracy.'}</p>`,
    confidence: result.confidence_score
  });
  
  // Confidence
  const confidence = result.confidence_score || 50;
  elements.confidenceFill.style.width = `${confidence}%`;
  elements.confidenceFill.className = `confidence-fill ${confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low'}`;
  elements.confidenceScore.textContent = confidence;
  
  // Metadata
  displayMetadata(result.page_metadata);
  
  // Summary
  elements.summaryText.textContent = result.page_summary || result.summary || 'No summary available.';
  
  // Claims with highlights
  displayClaims(result.claim_verdicts || []);
  
  // Corrections
  displayCorrections(result.suggested_corrections || []);
  
  // Evidence
  displayEvidence(result.supporting_evidence || []);
  
  // Recommendation
  if (result.recommendation) {
    elements.recommendationCard.classList.remove('hidden');
    elements.recommendationText.textContent = result.recommendation;
  } else {
    elements.recommendationCard.classList.add('hidden');
  }
  
  // Processing time
  elements.processingTime.textContent = result.processing_time_ms || 0;
}

/**
 * Display page metadata
 */
function displayMetadata(metadata) {
  if (!metadata) {
    elements.metadataSection.classList.add('hidden');
    return;
  }
  
  elements.metadataSection.classList.remove('hidden');
  
  const items = [
    { label: 'Topic', value: metadata.topic, icon: '📰' },
    { label: 'Content Type', value: metadata.content_type, icon: '📄' },
    { label: 'Bias', value: metadata.potential_bias, icon: '⚖️' },
    { label: 'Credibility', value: metadata.overall_credibility_signal, icon: '🎯' }
  ].filter(item => item.value);
  
  elements.metadataGrid.innerHTML = items.map((item, idx) => {
    const tooltipId = `metadata-${idx}`;
    tooltipDataMap.set(tooltipId, {
      type: 'metadata',
      title: item.label,
      content: `<p>${getMetadataDescription(item.label, item.value)}</p>`
    });
    
    return `
      <div class="metadata-item highlight-item metadata" data-tooltip-id="${tooltipId}">
        <div class="metadata-item-label">${item.icon} ${item.label}</div>
        <div class="metadata-item-value">${escapeHtml(item.value)}</div>
      </div>
    `;
  }).join('');
}

/**
 * Get metadata description for tooltip
 */
function getMetadataDescription(label, value) {
  const descriptions = {
    Topic: `The main subject of this page is <strong>${value}</strong>.`,
    'Content Type': `This content is classified as <strong>${value}</strong> content.`,
    Bias: `The detected potential bias is <strong>${value}</strong>. This is an AI assessment based on language patterns.`,
    Credibility: `The overall credibility signal is <strong>${value}</strong> based on source reputation and content analysis.`
  };
  return descriptions[label] || `${label}: ${value}`;
}

/**
 * Display claims with color-coded highlights
 */
function displayClaims(claims) {
  elements.claimsCount.textContent = claims.length;
  
  if (claims.length === 0) {
    elements.claimsList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No specific claims were extracted for verification.</p>';
    return;
  }
  
  elements.claimsList.innerHTML = claims.map((claim, idx) => {
    const tooltipId = `claim-${idx}`;
    const verdictClass = getVerdictClass(claim.verdict);
    
    tooltipDataMap.set(tooltipId, {
      type: 'claim',
      title: `Claim ${idx + 1}: ${claim.verdict}`,
      content: `
        <p><strong>Claim:</strong> "${escapeHtml(claim.claim)}"</p>
        <p><strong>Evidence:</strong> ${escapeHtml(claim.evidence_summary || 'No additional evidence.')}</p>
      `,
      confidence: claim.confidence,
      sources: claim.sources || []
    });
    
    return `
      <div class="highlight-item claim" data-tooltip-id="${tooltipId}">
        <div class="highlight-item-header">
          <span class="highlight-item-tag">Claim ${idx + 1}</span>
          <span class="highlight-item-verdict ${verdictClass}">${claim.verdict}</span>
        </div>
        <p class="highlight-item-text">${escapeHtml(claim.claim)}</p>
        <p class="highlight-item-subtext">${escapeHtml(claim.evidence_summary || '')}</p>
      </div>
    `;
  }).join('');
}

/**
 * Display corrections with highlights
 */
function displayCorrections(corrections) {
  if (corrections.length === 0) {
    elements.correctionsSection.classList.add('hidden');
    return;
  }
  
  elements.correctionsSection.classList.remove('hidden');
  
  elements.correctionsList.innerHTML = corrections.map((correction, idx) => {
    const tooltipId = `correction-${idx}`;
    
    tooltipDataMap.set(tooltipId, {
      type: 'correction',
      title: 'Suggested Correction',
      content: `
        <p><strong>Original (Misleading):</strong> "${escapeHtml(correction.original_claim)}"</p>
        <p><strong>Corrected Information:</strong> "${escapeHtml(correction.correction)}"</p>
      `,
      sources: correction.source ? [correction.source] : []
    });
    
    return `
      <div class="highlight-item correction" data-tooltip-id="${tooltipId}">
        <div class="highlight-item-header">
          <span class="highlight-item-tag">⚠️ Correction</span>
        </div>
        <p class="highlight-item-text" style="text-decoration: line-through; color: var(--error);">${escapeHtml(correction.original_claim)}</p>
        <p class="highlight-item-text" style="color: var(--success);">✓ ${escapeHtml(correction.correction)}</p>
        ${correction.source ? `<p class="highlight-item-subtext">Source: ${getDomainFromUrl(correction.source)}</p>` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Display evidence with highlights
 */
function displayEvidence(evidence) {
  elements.evidenceCount.textContent = evidence.length;
  
  if (evidence.length === 0) {
    elements.evidenceList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No external evidence sources found.</p>';
    return;
  }
  
  elements.evidenceList.innerHTML = evidence.slice(0, 6).map((ev, idx) => {
    const tooltipId = `evidence-${idx}`;
    
    tooltipDataMap.set(tooltipId, {
      type: 'evidence',
      title: ev.title || 'Evidence Source',
      content: `
        <p><strong>Source:</strong> ${getDomainFromUrl(ev.url)}</p>
        <p><strong>Relevance:</strong> ${escapeHtml(ev.relevance || 'Supporting evidence for the claims.')}</p>
      `,
      sources: [ev.url]
    });
    
    return `
      <div class="highlight-item evidence" data-tooltip-id="${tooltipId}">
        <div class="highlight-item-header">
          <span class="highlight-item-tag">🔗 Source</span>
        </div>
        <p class="highlight-item-text">${escapeHtml(ev.title || getDomainFromUrl(ev.url))}</p>
        <p class="highlight-item-subtext">${escapeHtml(ev.relevance || '')}</p>
      </div>
    `;
  }).join('');
}

/**
 * Get CSS class for verdict
 */
function getVerdictClass(verdict) {
  if (!verdict) return 'unverifiable';
  const v = verdict.toLowerCase().replace(/\s+/g, '-');
  if (v === 'true') return 'true';
  if (v === 'false') return 'false';
  if (v === 'misleading' || v === 'partially-true') return 'misleading';
  return 'unverifiable';
}

/**
 * Get SVG icon for verdict
 */
function getVerdictIconSVG(verdict) {
  const v = verdict?.toLowerCase() || '';
  
  if (v === 'true') {
    return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
  }
  if (v === 'false') {
    return '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
  }
  if (v === 'misleading' || v === 'partially true') {
    return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
  }
  return '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
}

/**
 * Handle new verification
 */
async function handleNewVerify() {
  // Clear highlights from the webpage
  const tab = await getCurrentTab();
  if (tab) {
    await clearHighlightsOnPage(tab.id);
  }
  
  switchState('initial');
  verificationResult = null;
  tooltipDataMap.clear();
}

/**
 * Handle share
 */
async function handleShare() {
  if (!verificationResult) return;
  
  const tab = await getCurrentTab();
  const text = `🛡️ SatyaTrail Verification Report\n\n📄 Page: ${tab.title}\n✅ Verdict: ${verificationResult.overall_verdict}\n📊 Confidence: ${verificationResult.confidence_score}%\n\n${verificationResult.summary || ''}\n\n🔗 Verified with SatyaTrail AI`;
  
  try {
    await navigator.clipboard.writeText(text);
    elements.shareBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!
    `;
    setTimeout(() => {
      elements.shareBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share Report
      `;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

/**
 * Toggle settings modal
 */
function toggleModal(show) {
  if (show) {
    elements.settingsModal.classList.remove('hidden');
  } else {
    elements.settingsModal.classList.add('hidden');
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  const settings = await getSettings();
  elements.apiUrl.value = settings.apiUrl;
  elements.autoVerify.checked = settings.autoVerify;
  elements.showNotifications.checked = settings.showNotifications;
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
 * Save settings to storage
 */
async function saveSettings() {
  const settings = {
    apiUrl: elements.apiUrl.value || DEFAULT_API_URL,
    autoVerify: elements.autoVerify.checked,
    showNotifications: elements.showNotifications.checked
  };
  
  await chrome.storage.sync.set(settings);
  toggleModal(false);
  
  elements.saveSettingsBtn.textContent = '✓ Saved!';
  setTimeout(() => {
    elements.saveSettingsBtn.textContent = 'Save Settings';
  }, 1500);
}

/**
 * Send results to content script for webpage highlighting
 */
async function highlightOnPage(tabId, result) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'highlightResults',
      result: result
    });
  } catch (error) {
    console.log('Could not highlight on page:', error.message);
    // Content script might not be loaded on this page
  }
}

/**
 * Clear highlights from page
 */
async function clearHighlightsOnPage(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'clearHighlights'
    });
  } catch (error) {
    console.log('Could not clear highlights:', error.message);
  }
}

/**
 * Store verification result
 */
async function storeResult(url, result) {
  const key = `result_${btoa(url).substring(0, 20)}`;
  await chrome.storage.local.set({
    [key]: { url, result, timestamp: Date.now() }
  });
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Utility: Sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
