import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(dateString) {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`
}

export function timeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(dateString)
}

export function truncate(str, length = 100) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length).trim() + '...'
}

export function getVerdictLabel(verdict) {
  const labels = {
    likely_true: 'Likely True',
    likely_false: 'Likely False',
    mixed: 'Mixed',
    unclear: 'Unclear',
    unchecked: 'Unchecked'
  }
  return labels[verdict] || 'Unknown'
}

export function getVerdictColor(verdict) {
  const colors = {
    likely_true: 'nb-ok',
    likely_false: 'nb-error',
    mixed: 'nb-warn',
    unclear: 'neutral',
    unchecked: 'neutral'
  }
  return colors[verdict] || 'neutral'
}

export function getRoleColor(role) {
  const colors = {
    origin: '#6EE7B7',
    amplifier: '#60A5FA',
    debunker: '#EF4444',
    commentary: '#F59E0B'
  }
  return colors[role] || '#999'
}

export function getRoleLabel(role) {
  const labels = {
    origin: 'Origin',
    amplifier: 'Amplifier',
    debunker: 'Debunker',
    commentary: 'Commentary'
  }
  return labels[role] || role
}

