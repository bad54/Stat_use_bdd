/**
 * Gestion des secrets API — MVP
 *
 * En MVP : encodage base64 (NOT encryption).
 * Pour la production, remplacer encode/decode par un appel à un KMS
 * (AWS KMS, Azure Key Vault, HashiCorp Vault, etc.).
 *
 * IMPORTANT : ne jamais logger les valeurs décodées.
 */

/** Encode un secret pour stockage (MVP: base64). */
export function encodeSecret(plaintext: string): string {
  return Buffer.from(plaintext, 'utf-8').toString('base64')
}

/** Décode un secret depuis le stockage. */
export function decodeSecret(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8')
}

/**
 * Produit une version masquée d'un secret pour affichage.
 * Ex: "my-secret-api-key-1234" → "****key-1234" (4 derniers caractères).
 */
export function maskSecret(plaintext: string): string {
  if (!plaintext || plaintext.length === 0) return ''
  const visible = plaintext.slice(-4)
  return `****${visible}`
}

/**
 * Prépare un secret entrant pour stockage :
 * - encode la valeur
 * - génère la version masquée
 * Retourne null si la valeur est vide (pas de changement).
 */
export function prepareSecret(value: string | undefined | null): {
  encoded: string
  masked: string
} | null {
  if (!value || value.trim() === '') return null
  const trimmed = value.trim()
  return {
    encoded: encodeSecret(trimmed),
    masked: maskSecret(trimmed),
  }
}

/**
 * Retourne le secret décodé depuis un champ encoded.
 * Retourne null si le champ est absent.
 */
export function resolveSecret(encoded: string | null | undefined): string | null {
  if (!encoded) return null
  try {
    return decodeSecret(encoded)
  } catch {
    return null
  }
}
