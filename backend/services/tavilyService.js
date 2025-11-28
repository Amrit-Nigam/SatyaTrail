/**
 * Tavily Search Service
 * 
 * Handles all web search and browsing operations using Tavily API.
 * This is the ONLY search provider - no fallback to other search engines.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const TAVILY_API_BASE = 'https://api.tavily.com';

class TavilyService {
  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY is required. Tavily is the mandatory search provider.');
    }

    this.client = axios.create({
      baseURL: TAVILY_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Search for relevant content using Tavily
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.maxResults - Maximum number of results (default: 10)
   * @param {string} options.searchDepth - 'basic' or 'advanced' (default: 'advanced')
   * @param {boolean} options.includeAnswer - Include AI-generated answer (default: true)
   * @param {boolean} options.includeRawContent - Include raw page content (default: false)
   * @param {string[]} options.includeDomains - Domains to include
   * @param {string[]} options.excludeDomains - Domains to exclude
   * @param {string} options.topic - Topic filter: 'general' or 'news' (default: 'news')
   * @returns {Promise<Object>} Search results with metadata
   */
  async search(query, options = {}) {
    const {
      maxResults = 10,
      searchDepth = 'advanced',
      includeAnswer = true,
      includeRawContent = false,
      includeDomains = [],
      excludeDomains = [],
      topic = 'news'
    } = options;

    logger.info('Tavily search initiated', { query, options });

    try {
      const response = await this.client.post('/search', {
        api_key: this.apiKey,
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: includeAnswer,
        include_raw_content: includeRawContent,
        include_domains: includeDomains.length > 0 ? includeDomains : undefined,
        exclude_domains: excludeDomains.length > 0 ? excludeDomains : undefined,
        topic
      });

      const results = this.processSearchResults(response.data);
      
      logger.info('Tavily search completed', { 
        query, 
        resultCount: results.results.length 
      });

      return results;
    } catch (error) {
      logger.error('Tavily search failed', {
        query,
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Tavily search failed: ${error.message}`);
    }
  }

  /**
   * Process and enrich search results with domain reputation heuristics
   * @param {Object} data - Raw Tavily response
   * @returns {Object} Processed results
   */
  processSearchResults(data) {
    const results = (data.results || []).map(result => ({
      url: result.url,
      title: result.title,
      snippet: result.content,
      publishDate: result.published_date || null,
      score: result.score,
      domainReputationScore: this.calculateDomainReputation(result.url),
      rawContent: result.raw_content || null
    }));

    // Sort by combined score (relevance + domain reputation)
    results.sort((a, b) => {
      const scoreA = (a.score * 0.6) + (a.domainReputationScore * 0.4);
      const scoreB = (b.score * 0.6) + (b.domainReputationScore * 0.4);
      return scoreB - scoreA;
    });

    return {
      query: data.query,
      answer: data.answer || null,
      results,
      responseTime: data.response_time,
      totalResults: results.length
    };
  }

  /**
   * Calculate domain reputation score based on heuristics
   * @param {string} url - URL to evaluate
   * @returns {number} Reputation score 0-100
   */
  calculateDomainReputation(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();

      // High reputation news sources
      const highReputation = [
        'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk',
        'theguardian.com', 'nytimes.com', 'washingtonpost.com',
        'thehindu.com', 'indianexpress.com', 'ndtv.com',
        'timesofindia.indiatimes.com', 'hindustantimes.com',
        'economictimes.indiatimes.com', 'livemint.com',
        'pib.gov.in', 'gov.in', 'who.int', 'un.org'
      ];

      // Medium reputation sources
      const mediumReputation = [
        'indiatoday.in', 'news18.com', 'firstpost.com',
        'thequint.com', 'scroll.in', 'theprint.in',
        'moneycontrol.com', 'businesstoday.in'
      ];

      // Low reputation / social media
      const lowReputation = [
        'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
        'tiktok.com', 'reddit.com', 'youtube.com'
      ];

      // Check domain against reputation lists
      for (const d of highReputation) {
        if (domain.includes(d)) return 90;
      }
      for (const d of mediumReputation) {
        if (domain.includes(d)) return 70;
      }
      for (const d of lowReputation) {
        if (domain.includes(d)) return 30;
      }

      // Government and educational domains
      if (domain.endsWith('.gov') || domain.endsWith('.gov.in')) return 95;
      if (domain.endsWith('.edu') || domain.endsWith('.ac.in')) return 85;
      if (domain.endsWith('.org')) return 75;

      // Default score for unknown domains
      return 50;
    } catch {
      return 50;
    }
  }

  /**
   * Fetch full article content from a URL
   * @param {string} url - Article URL to fetch
   * @returns {Promise<Object>} Article content and metadata
   */
  async fetch(url) {
    logger.info('Tavily fetch initiated', { url });

    try {
      // Use Tavily's extract endpoint for full content
      const response = await this.client.post('/extract', {
        api_key: this.apiKey,
        urls: [url]
      });

      const result = response.data.results?.[0];

      if (!result) {
        throw new Error('No content extracted from URL');
      }

      const extracted = {
        url: result.url,
        title: result.title || this.extractTitleFromUrl(url),
        content: result.raw_content || result.content,
        publishDate: result.published_date || null,
        author: result.author || null,
        domainReputationScore: this.calculateDomainReputation(url),
        metadata: {
          wordCount: result.raw_content ? result.raw_content.split(/\s+/).length : 0,
          domain: new URL(url).hostname,
          fetchedAt: new Date().toISOString()
        }
      };

      logger.info('Tavily fetch completed', { url, wordCount: extracted.metadata.wordCount });

      return extracted;
    } catch (error) {
      logger.error('Tavily fetch failed', { url, error: error.message });
      
      // Fallback: try search with the URL as query
      try {
        const searchResult = await this.search(url, { 
          maxResults: 1, 
          includeRawContent: true 
        });
        
        if (searchResult.results.length > 0) {
          return {
            url,
            title: searchResult.results[0].title,
            content: searchResult.results[0].rawContent || searchResult.results[0].snippet,
            publishDate: searchResult.results[0].publishDate,
            author: null,
            domainReputationScore: searchResult.results[0].domainReputationScore,
            metadata: {
              wordCount: (searchResult.results[0].snippet || '').split(/\s+/).length,
              domain: new URL(url).hostname,
              fetchedAt: new Date().toISOString(),
              fallback: true
            }
          };
        }
      } catch (fallbackError) {
        logger.error('Tavily fetch fallback failed', { url, error: fallbackError.message });
      }

      throw new Error(`Failed to fetch article content: ${error.message}`);
    }
  }

  /**
   * Search for news about a specific claim
   * @param {string} claim - The claim to verify
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchClaim(claim, options = {}) {
    // Search for the claim directly
    const directResults = await this.search(claim, {
      ...options,
      topic: 'news',
      maxResults: options.maxResults || 5
    });

    // Search for fact-checks about the claim
    const factCheckResults = await this.search(`fact check ${claim}`, {
      ...options,
      topic: 'news',
      maxResults: 3,
      includeDomains: [
        'snopes.com', 'factcheck.org', 'politifact.com',
        'altnews.in', 'boomlive.in', 'thequint.com/news/webqoof'
      ]
    });

    return {
      directResults: directResults.results,
      factCheckResults: factCheckResults.results,
      answer: directResults.answer,
      totalResults: directResults.results.length + factCheckResults.results.length
    };
  }

  /**
   * Extract title from URL as fallback
   * @param {string} url - URL to extract title from
   * @returns {string} Extracted title
   */
  extractTitleFromUrl(url) {
    try {
      const pathname = new URL(url).pathname;
      const slug = pathname.split('/').filter(Boolean).pop() || '';
      return slug.replace(/[-_]/g, ' ').replace(/\.(html|htm|php|asp)$/i, '');
    } catch {
      return 'Unknown Title';
    }
  }
}

// Export singleton instance
module.exports = new TavilyService();

