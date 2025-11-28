/**
 * SatyaTrail Chrome Extension - Content Script
 * 
 * Injects highlights and tooltips directly on webpages for validated information.
 * Clean, non-intrusive DOM manipulation with smooth tooltip interactions.
 */

(() => {
  // Prevent multiple injections
  if (window.__satyatrailInjected) return;
  window.__satyatrailInjected = true;

  // ==================== CONFIGURATION ====================
  
  const CONFIG = {
    HIGHLIGHT_COLORS: {
      claim: {
        true: { bg: 'rgba(34, 197, 94, 0.25)', border: '#22c55e', text: '#166534' },
        false: { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444', text: '#991b1b' },
        misleading: { bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b', text: '#92400e' },
        unverifiable: { bg: 'rgba(59, 130, 246, 0.25)', border: '#3b82f6', text: '#1e40af' },
        default: { bg: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6', text: '#5b21b6' }
      },
      evidence: { bg: 'rgba(6, 182, 212, 0.2)', border: '#06b6d4', text: '#0e7490' },
      source: { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', text: '#92400e' },
      correction: { bg: 'rgba(244, 63, 94, 0.25)', border: '#f43f5e', text: '#be123c' },
      metadata: { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899', text: '#9d174d' }
    },
    TOOLTIP_OFFSET: { x: 15, y: 15 },
    HIGHLIGHT_CLASS: 'satyatrail-highlight',
    TOOLTIP_ID: 'satyatrail-tooltip',
    STYLES_ID: 'satyatrail-styles'
  };

  // ==================== STYLES INJECTION ====================
  
  function injectStyles() {
    if (document.getElementById(CONFIG.STYLES_ID)) return;
    
    const styles = document.createElement('style');
    styles.id = CONFIG.STYLES_ID;
    styles.textContent = `
      /* SatyaTrail Highlight Styles */
      .${CONFIG.HIGHLIGHT_CLASS} {
        position: relative;
        border-radius: 3px;
        padding: 1px 3px;
        margin: 0 -3px;
        cursor: help;
        transition: all 0.2s ease;
        display: inline;
        text-decoration-style: wavy;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }
      
      .${CONFIG.HIGHLIGHT_CLASS}:hover {
        filter: brightness(1.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      /* Claim highlights by verdict */
      .${CONFIG.HIGHLIGHT_CLASS}[data-verdict="true"] {
        background: ${CONFIG.HIGHLIGHT_COLORS.claim.true.bg};
        border-bottom: 2px solid ${CONFIG.HIGHLIGHT_COLORS.claim.true.border};
        text-decoration-color: ${CONFIG.HIGHLIGHT_COLORS.claim.true.border};
      }
      
      .${CONFIG.HIGHLIGHT_CLASS}[data-verdict="false"] {
        background: ${CONFIG.HIGHLIGHT_COLORS.claim.false.bg};
        border-bottom: 2px solid ${CONFIG.HIGHLIGHT_COLORS.claim.false.border};
        text-decoration-color: ${CONFIG.HIGHLIGHT_COLORS.claim.false.border};
      }
      
      .${CONFIG.HIGHLIGHT_CLASS}[data-verdict="misleading"],
      .${CONFIG.HIGHLIGHT_CLASS}[data-verdict="partially true"] {
        background: ${CONFIG.HIGHLIGHT_COLORS.claim.misleading.bg};
        border-bottom: 2px solid ${CONFIG.HIGHLIGHT_COLORS.claim.misleading.border};
        text-decoration-color: ${CONFIG.HIGHLIGHT_COLORS.claim.misleading.border};
      }
      
      .${CONFIG.HIGHLIGHT_CLASS}[data-verdict="unverifiable"] {
        background: ${CONFIG.HIGHLIGHT_COLORS.claim.unverifiable.bg};
        border-bottom: 2px solid ${CONFIG.HIGHLIGHT_COLORS.claim.unverifiable.border};
        text-decoration-color: ${CONFIG.HIGHLIGHT_COLORS.claim.unverifiable.border};
      }
      
      /* Category highlights */
      .${CONFIG.HIGHLIGHT_CLASS}[data-category="evidence"] {
        background: ${CONFIG.HIGHLIGHT_COLORS.evidence.bg};
        border-bottom: 2px solid ${CONFIG.HIGHLIGHT_COLORS.evidence.border};
      }
      
      .${CONFIG.HIGHLIGHT_CLASS}[data-category="correction"] {
        background: ${CONFIG.HIGHLIGHT_COLORS.correction.bg};
        border-bottom: 2px solid ${CONFIG.HIGHLIGHT_COLORS.correction.border};
        text-decoration: line-through;
      }
      
      /* Tooltip Styles */
      #${CONFIG.TOOLTIP_ID} {
        position: fixed;
        z-index: 2147483647;
        max-width: 360px;
        padding: 0;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        font-size: 13px;
        line-height: 1.5;
        color: #e5e5e5;
        pointer-events: none;
        opacity: 0;
        transform: translateY(8px) scale(0.96);
        transition: opacity 0.2s ease, transform 0.2s ease;
        overflow: hidden;
      }
      
      #${CONFIG.TOOLTIP_ID}.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: linear-gradient(135deg, #252525 0%, #1f1f1f 100%);
        border-bottom: 1px solid #333;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-badge.true {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-badge.false {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-badge.misleading {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-badge.unverifiable {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-confidence {
        margin-left: auto;
        font-size: 12px;
        color: #888;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-confidence strong {
        color: #fff;
        font-weight: 600;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-body {
        padding: 14px;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-claim {
        font-size: 12px;
        color: #a0a0a0;
        margin-bottom: 10px;
        padding: 10px;
        background: rgba(255,255,255,0.03);
        border-radius: 6px;
        border-left: 3px solid #444;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-claim strong {
        color: #fff;
        font-weight: 500;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-evidence {
        font-size: 12px;
        color: #d0d0d0;
        line-height: 1.6;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-evidence strong {
        color: #06b6d4;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-footer {
        padding: 10px 14px;
        background: #151515;
        border-top: 1px solid #2a2a2a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-source {
        font-size: 10px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-source a {
        color: #818cf8;
        text-decoration: none;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-tooltip-icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-confidence-bar {
        flex: 1;
        height: 4px;
        background: #333;
        border-radius: 2px;
        overflow: hidden;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-confidence-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.5s ease;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-confidence-fill.high { background: linear-gradient(90deg, #22c55e, #4ade80); }
      #${CONFIG.TOOLTIP_ID} .st-confidence-fill.medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
      #${CONFIG.TOOLTIP_ID} .st-confidence-fill.low { background: linear-gradient(90deg, #ef4444, #f87171); }
      
      /* Correction specific styles */
      #${CONFIG.TOOLTIP_ID} .st-correction-original {
        text-decoration: line-through;
        color: #f87171;
        font-size: 12px;
        margin-bottom: 8px;
      }
      
      #${CONFIG.TOOLTIP_ID} .st-correction-fixed {
        color: #4ade80;
        font-size: 12px;
        padding-left: 10px;
        border-left: 2px solid #4ade80;
      }
      
      /* SatyaTrail floating indicator */
      #satyatrail-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483646;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        border: 1px solid #333;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        color: #e5e5e5;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: satyatrail-slide-in 0.4s ease;
      }
      
      @keyframes satyatrail-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      #satyatrail-indicator:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      }
      
      #satyatrail-indicator .st-indicator-icon {
        width: 24px;
        height: 24px;
      }
      
      #satyatrail-indicator .st-indicator-verdict {
        font-weight: 700;
      }
      
      #satyatrail-indicator .st-indicator-verdict.true { color: #4ade80; }
      #satyatrail-indicator .st-indicator-verdict.false { color: #f87171; }
      #satyatrail-indicator .st-indicator-verdict.misleading { color: #fbbf24; }
      #satyatrail-indicator .st-indicator-verdict.unverifiable { color: #60a5fa; }
      
      #satyatrail-indicator .st-indicator-count {
        font-size: 11px;
        color: #888;
      }
      
      #satyatrail-indicator .st-indicator-close {
        margin-left: 8px;
        padding: 4px;
        border-radius: 4px;
        color: #666;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      #satyatrail-indicator .st-indicator-close:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }
    `;
    
    document.head.appendChild(styles);
  }

  // ==================== TOOLTIP MANAGEMENT ====================
  
  let tooltipElement = null;
  let currentHighlight = null;
  
  function createTooltip() {
    if (document.getElementById(CONFIG.TOOLTIP_ID)) {
      tooltipElement = document.getElementById(CONFIG.TOOLTIP_ID);
      return;
    }
    
    tooltipElement = document.createElement('div');
    tooltipElement.id = CONFIG.TOOLTIP_ID;
    document.body.appendChild(tooltipElement);
  }
  
  function showTooltip(element, e) {
    if (!tooltipElement) createTooltip();
    
    const data = JSON.parse(element.dataset.satyatrail || '{}');
    if (!data.type) return;
    
    currentHighlight = element;
    
    // Build tooltip content
    const verdict = data.verdict?.toLowerCase() || 'unverifiable';
    const verdictClass = verdict.replace(/\s+/g, '-');
    const confidence = data.confidence || 0;
    const confidenceClass = confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low';
    
    let content = '';
    
    if (data.type === 'claim') {
      content = `
        <div class="st-tooltip-header">
          <span class="st-tooltip-badge ${verdictClass}">
            ${getVerdictIcon(verdict)}
            ${data.verdict || 'Unknown'}
          </span>
          <span class="st-tooltip-confidence">
            <strong>${confidence}%</strong> confidence
          </span>
        </div>
        <div class="st-tooltip-body">
          <div class="st-tooltip-claim">
            <strong>Claim:</strong> "${escapeHtml(data.claim || data.text || '')}"
          </div>
          <div class="st-tooltip-evidence">
            <strong>Evidence:</strong> ${escapeHtml(data.evidence || 'No additional evidence available.')}
          </div>
        </div>
        <div class="st-tooltip-footer">
          <div class="st-confidence-bar">
            <div class="st-confidence-fill ${confidenceClass}" style="width: ${confidence}%"></div>
          </div>
          ${data.sources?.length ? `
            <div class="st-tooltip-source">
              ${getSourceIcon()}
              <a href="${data.sources[0]}" target="_blank">${getDomain(data.sources[0])}</a>
              ${data.sources.length > 1 ? `+${data.sources.length - 1} more` : ''}
            </div>
          ` : ''}
        </div>
      `;
    } else if (data.type === 'correction') {
      content = `
        <div class="st-tooltip-header">
          <span class="st-tooltip-badge false">
            ${getWarningIcon()}
            Correction Needed
          </span>
        </div>
        <div class="st-tooltip-body">
          <div class="st-correction-original">
            ✗ ${escapeHtml(data.original || data.text || '')}
          </div>
          <div class="st-correction-fixed">
            ✓ ${escapeHtml(data.correction || '')}
          </div>
        </div>
        ${data.source ? `
          <div class="st-tooltip-footer">
            <div class="st-tooltip-source">
              ${getSourceIcon()}
              <a href="${data.source}" target="_blank">${getDomain(data.source)}</a>
            </div>
          </div>
        ` : ''}
      `;
    }
    
    tooltipElement.innerHTML = content;
    
    // Position tooltip near cursor
    positionTooltip(e);
    
    // Show tooltip
    requestAnimationFrame(() => {
      tooltipElement.classList.add('visible');
    });
  }
  
  function hideTooltip() {
    if (tooltipElement) {
      tooltipElement.classList.remove('visible');
    }
    currentHighlight = null;
  }
  
  function positionTooltip(e) {
    if (!tooltipElement) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = mouseX + CONFIG.TOOLTIP_OFFSET.x;
    let top = mouseY + CONFIG.TOOLTIP_OFFSET.y;
    
    // Prevent tooltip from going off-screen right
    if (left + tooltipRect.width > viewportWidth - 20) {
      left = mouseX - tooltipRect.width - CONFIG.TOOLTIP_OFFSET.x;
    }
    
    // Prevent tooltip from going off-screen bottom
    if (top + tooltipRect.height > viewportHeight - 20) {
      top = mouseY - tooltipRect.height - CONFIG.TOOLTIP_OFFSET.y;
    }
    
    // Ensure minimum positions
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
  }

  // ==================== HIGHLIGHT MANAGEMENT ====================
  
  let highlightedElements = [];
  
  function highlightValidatedPoints(verificationResult) {
    // Clear existing highlights first
    clearHighlights();
    
    if (!verificationResult) return;
    
    const claims = verificationResult.claim_verdicts || [];
    const corrections = verificationResult.suggested_corrections || [];
    
    // Highlight claims
    claims.forEach((claim, index) => {
      if (claim.claim && claim.claim.length > 20) {
        highlightTextOnPage(claim.claim, {
          type: 'claim',
          verdict: claim.verdict,
          confidence: claim.confidence,
          evidence: claim.evidence_summary,
          sources: claim.sources,
          index
        });
      }
    });
    
    // Highlight corrections (original misleading text)
    corrections.forEach((correction, index) => {
      if (correction.original_claim && correction.original_claim.length > 20) {
        highlightTextOnPage(correction.original_claim, {
          type: 'correction',
          original: correction.original_claim,
          correction: correction.correction,
          source: correction.source,
          index
        });
      }
    });
    
    // Show floating indicator
    showFloatingIndicator(verificationResult);
  }
  
  function highlightTextOnPage(searchText, data) {
    // Normalize search text
    const normalizedSearch = normalizeText(searchText);
    if (normalizedSearch.length < 20) return;
    
    // Create TreeWalker to find text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script, style, and already highlighted elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          if (parent.closest(`.${CONFIG.HIGHLIGHT_CLASS}`)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Check if this text contains our search
          const normalizedText = normalizeText(node.textContent);
          if (normalizedText.includes(normalizedSearch.substring(0, 50))) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    const matchingNodes = [];
    let node;
    while (node = walker.nextNode()) {
      matchingNodes.push(node);
    }
    
    // Limit to first 3 matches to avoid over-highlighting
    matchingNodes.slice(0, 3).forEach(textNode => {
      try {
        wrapTextWithHighlight(textNode, searchText, data);
      } catch (e) {
        console.warn('SatyaTrail: Could not highlight text', e);
      }
    });
  }
  
  function wrapTextWithHighlight(textNode, searchText, data) {
    const text = textNode.textContent;
    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchText).substring(0, 80);
    
    // Find best match position using fuzzy matching
    const matchIndex = findBestMatchIndex(normalizedText, normalizedSearch);
    if (matchIndex === -1) return;
    
    // Find the actual position in original text
    let realIndex = 0;
    let normalizedIndex = 0;
    while (normalizedIndex < matchIndex && realIndex < text.length) {
      if (text[realIndex].match(/\S/)) {
        normalizedIndex++;
      }
      realIndex++;
    }
    
    // Calculate end position
    const matchLength = Math.min(searchText.length, 150);
    const endIndex = Math.min(realIndex + matchLength, text.length);
    
    // Create highlight wrapper
    const span = document.createElement('span');
    span.className = CONFIG.HIGHLIGHT_CLASS;
    span.dataset.verdict = (data.verdict || 'unverifiable').toLowerCase();
    span.dataset.category = data.type;
    span.dataset.satyatrail = JSON.stringify(data);
    
    // Split text and wrap matched portion
    const beforeText = text.substring(0, realIndex);
    const matchedText = text.substring(realIndex, endIndex);
    const afterText = text.substring(endIndex);
    
    // Create new nodes
    const parent = textNode.parentNode;
    if (!parent) return;
    
    const fragment = document.createDocumentFragment();
    
    if (beforeText) {
      fragment.appendChild(document.createTextNode(beforeText));
    }
    
    span.textContent = matchedText;
    fragment.appendChild(span);
    
    if (afterText) {
      fragment.appendChild(document.createTextNode(afterText));
    }
    
    parent.replaceChild(fragment, textNode);
    highlightedElements.push(span);
  }
  
  function findBestMatchIndex(text, search) {
    // Try exact match first
    let index = text.indexOf(search);
    if (index !== -1) return index;
    
    // Try shorter versions
    for (let len = search.length; len >= 30; len -= 10) {
      index = text.indexOf(search.substring(0, len));
      if (index !== -1) return index;
    }
    
    return -1;
  }
  
  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }
  
  function clearHighlights() {
    // Remove all highlight wrappers
    highlightedElements.forEach(el => {
      if (el && el.parentNode) {
        const text = el.textContent;
        const textNode = document.createTextNode(text);
        el.parentNode.replaceChild(textNode, el);
      }
    });
    highlightedElements = [];
    
    // Remove floating indicator
    const indicator = document.getElementById('satyatrail-indicator');
    if (indicator) indicator.remove();
    
    // Hide tooltip
    hideTooltip();
  }

  // ==================== FLOATING INDICATOR ====================
  
  function showFloatingIndicator(result) {
    // Remove existing indicator
    const existing = document.getElementById('satyatrail-indicator');
    if (existing) existing.remove();
    
    const verdict = result.overall_verdict || 'Unverifiable';
    const verdictClass = verdict.toLowerCase().replace(/\s+/g, '-');
    const claimsCount = (result.claim_verdicts || []).length;
    const confidence = result.confidence_score || 0;
    
    const indicator = document.createElement('div');
    indicator.id = 'satyatrail-indicator';
    indicator.innerHTML = `
      <svg class="st-indicator-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
      <div>
        <div class="st-indicator-verdict ${verdictClass}">${verdict}</div>
        <div class="st-indicator-count">${claimsCount} claims verified • ${confidence}% confidence</div>
      </div>
      <div class="st-indicator-close" title="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
    `;
    
    document.body.appendChild(indicator);
    
    // Close button handler
    indicator.querySelector('.st-indicator-close').addEventListener('click', (e) => {
      e.stopPropagation();
      clearHighlights();
    });
    
    // Click indicator to toggle highlights visibility
    indicator.addEventListener('click', () => {
      const highlights = document.querySelectorAll(`.${CONFIG.HIGHLIGHT_CLASS}`);
      highlights.forEach(h => {
        h.style.display = h.style.display === 'none' ? '' : 'none';
      });
    });
  }

  // ==================== HELPER FUNCTIONS ====================
  
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
  
  function getVerdictIcon(verdict) {
    const icons = {
      true: '<svg class="st-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      false: '<svg class="st-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      misleading: '<svg class="st-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      unverifiable: '<svg class="st-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    return icons[verdict?.toLowerCase()] || icons.unverifiable;
  }
  
  function getWarningIcon() {
    return '<svg class="st-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  }
  
  function getSourceIcon() {
    return '<svg class="st-tooltip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
  }

  // ==================== EVENT LISTENERS ====================
  
  function setupEventListeners() {
    // Mouse move for tooltip positioning
    document.addEventListener('mousemove', (e) => {
      if (currentHighlight && tooltipElement?.classList.contains('visible')) {
        positionTooltip(e);
      }
    });
    
    // Mouse enter on highlights
    document.addEventListener('mouseenter', (e) => {
      const highlight = e.target.closest(`.${CONFIG.HIGHLIGHT_CLASS}`);
      if (highlight) {
        showTooltip(highlight, e);
      }
    }, true);
    
    // Mouse leave on highlights
    document.addEventListener('mouseleave', (e) => {
      const highlight = e.target.closest(`.${CONFIG.HIGHLIGHT_CLASS}`);
      if (highlight) {
        hideTooltip();
      }
    }, true);
  }

  // ==================== MESSAGE HANDLING ====================
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'highlightResults') {
      injectStyles();
      createTooltip();
      highlightValidatedPoints(message.result);
      sendResponse({ success: true, count: highlightedElements.length });
      return true;
    }
    
    if (message.action === 'clearHighlights') {
      clearHighlights();
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === 'extractContent') {
      const content = extractPageContent();
      sendResponse({ content });
      return true;
    }
    
    if (message.action === 'getSelectedText') {
      const selectedText = window.getSelection().toString();
      sendResponse({ selectedText });
      return true;
    }
  });
  
  function extractPageContent() {
    const clone = document.body.cloneNode(true);
    
    const removeSelectors = [
      'script', 'style', 'noscript', 'iframe', 
      'nav', 'footer', 'header', 'aside',
      '.ad', '.advertisement', '.sidebar', '.menu',
      '.navigation', '.footer', '.header', '.comments',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '.social-share', '.related-posts', '.newsletter'
    ];
    
    removeSelectors.forEach(selector => {
      try {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      } catch (e) {}
    });
    
    const mainContent = clone.querySelector('article, main, [role="main"], .post-content, .article-content, .entry-content');
    const contentElement = mainContent || clone;
    
    let text = contentElement.innerText || contentElement.textContent;
    text = text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    
    return {
      text: text.substring(0, 50000),
      metadata: {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        author: document.querySelector('meta[name="author"]')?.content || '',
        publishDate: document.querySelector('meta[property="article:published_time"]')?.content || ''
      },
      url: window.location.href
    };
  }

  // ==================== INITIALIZATION ====================
  
  function init() {
    injectStyles();
    createTooltip();
    setupEventListeners();
    console.log('🛡️ SatyaTrail content script initialized');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose API for external access
  window.SatyaTrail = {
    highlight: highlightValidatedPoints,
    clear: clearHighlights,
    extractContent: extractPageContent
  };
})();
