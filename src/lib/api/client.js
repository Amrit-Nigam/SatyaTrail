/**
 * API Client for SatyaTrail Backend
 * Handles all communication with the backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/api/v1/verify')
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, config)
    
    const data = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      throw new APIError(
        data.message || data.error || 'An error occurred',
        response.status,
        data
      )
    }
    
    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Network error or other fetch error
    throw new APIError(
      error.message || 'Network error - please check your connection',
      0,
      null
    )
  }
}

/**
 * API Client object with all methods
 */
export const apiClient = {
  /**
   * Health check
   */
  async health() {
    return request('/health')
  },

  /**
   * Verify a news claim or URL
   * @param {Object} params
   * @param {string} [params.url] - URL to verify
   * @param {string} [params.text] - Text/claim to verify
   * @param {string} [params.source] - Source of request (frontend, telegram, etc.)
   * @returns {Promise<VerificationResult>}
   */
  async verify({ url, text, source = 'frontend' }) {
    return request('/api/v1/verify', {
      method: 'POST',
      body: JSON.stringify({ url, text, source })
    })
  },

  /**
   * Get verification by hash
   * @param {string} hash - Graph hash
   * @returns {Promise<VerificationResult>}
   */
  async getVerification(hash) {
    return request(`/api/v1/verify/${hash}`)
  },

  /**
   * Get recent verifications
   * @param {number} [limit=10] - Number of results
   * @returns {Promise<{verifications: Array, count: number}>}
   */
  async getRecentVerifications(limit = 10) {
    return request(`/api/v1/verify/recent?limit=${limit}`)
  },

  /**
   * Get verification statistics
   * @returns {Promise<{bySource: Object}>}
   */
  async getStats() {
    return request('/api/v1/verify/stats')
  },

  /**
   * Quick verification for browser extension
   * @param {Object} params
   * @param {string} [params.url] - URL to verify
   * @param {string} [params.text] - Text to verify
   * @returns {Promise<QuickVerificationResult>}
   */
  async verifyQuick({ url, text }) {
    return request('/api/v1/verify/extension/quick', {
      method: 'POST',
      body: JSON.stringify({ url, text })
    })
  }
}

export default apiClient

