import { describe, it, expect } from 'vitest'
import { encodeSecret, maskSecret, prepareSecret, resolveSecret } from '~/server/utils/secrets'

describe('encodeSecret', () => {
  it('encodes a plaintext string to base64', () => {
    expect(encodeSecret('hello')).toBe(Buffer.from('hello').toString('base64'))
  })

  it('round-trips through resolveSecret', () => {
    const encoded = encodeSecret('my-api-key-12345')
    expect(resolveSecret(encoded)).toBe('my-api-key-12345')
  })
})

describe('maskSecret', () => {
  it('shows only last 4 chars', () => {
    expect(maskSecret('abcdefgh')).toBe('****efgh')
  })

  it('handles short strings', () => {
    expect(maskSecret('ab')).toBe('****ab')
  })

  it('returns empty string for empty input', () => {
    expect(maskSecret('')).toBe('')
  })
})

describe('prepareSecret', () => {
  it('returns encoded and masked fields for a valid string', () => {
    const result = prepareSecret('my-secret')
    expect(result).not.toBeNull()
    expect(result!.encoded).toBe(encodeSecret('my-secret'))
    expect(result!.masked).toBe(maskSecret('my-secret'))
  })

  it('returns null for empty string', () => {
    expect(prepareSecret('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(prepareSecret('   ')).toBeNull()
  })

  it('returns null for null/undefined', () => {
    expect(prepareSecret(null)).toBeNull()
    expect(prepareSecret(undefined)).toBeNull()
  })
})

describe('resolveSecret', () => {
  it('returns null for null/undefined', () => {
    expect(resolveSecret(null)).toBeNull()
    expect(resolveSecret(undefined)).toBeNull()
  })

  it('decodes a base64-encoded secret', () => {
    const encoded = Buffer.from('supersecret').toString('base64')
    expect(resolveSecret(encoded)).toBe('supersecret')
  })
})
