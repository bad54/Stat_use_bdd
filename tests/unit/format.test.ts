import { describe, it, expect } from 'vitest'
import { formatNumber, formatPercent, monthName, statusBadge, providerTypeBadge } from '../../utils/format'

describe('formatNumber', () => {
  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats large numbers with French locale', () => {
    const result = formatNumber(1500000)
    // French locale uses non-breaking space as thousands separator
    expect(result.replace(/\s/g, ' ')).toContain('1')
    expect(result).toContain('500')
  })

  it('handles null', () => {
    expect(formatNumber(null)).toBe('—')
  })

  it('handles undefined', () => {
    expect(formatNumber(undefined)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('formats positive percent with sign', () => {
    expect(formatPercent(12.5)).toBe('+12.5%')
  })

  it('formats negative percent', () => {
    expect(formatPercent(-8.3)).toBe('-8.3%')
  })

  it('handles null', () => {
    expect(formatPercent(null)).toBe('—')
  })
})

describe('monthName', () => {
  it('returns correct French month name', () => {
    expect(monthName(1)).toBe('janvier')
    expect(monthName(12)).toBe('décembre')
    expect(monthName(6)).toBe('juin')
  })
})

describe('statusBadge', () => {
  it('returns correct class for SUCCESS', () => {
    const result = statusBadge('SUCCESS')
    expect(result.class).toBe('badge-green')
    expect(result.label).toBe('Succès')
  })

  it('returns correct class for FAILED', () => {
    const result = statusBadge('FAILED')
    expect(result.class).toBe('badge-red')
  })

  it('returns gray for unknown status', () => {
    const result = statusBadge('UNKNOWN')
    expect(result.class).toBe('badge-gray')
  })
})

describe('providerTypeBadge', () => {
  it('returns correct badge for API_SUSHI', () => {
    const result = providerTypeBadge('API_SUSHI')
    expect(result.label).toBe('API SUSHI')
    expect(result.class).toBe('badge-blue')
  })

  it('returns correct badge for FILE_IMPORT', () => {
    const result = providerTypeBadge('FILE_IMPORT')
    expect(result.label).toBe('Import fichier')
  })
})
