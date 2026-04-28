export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function formatPercent(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(decimals)}%`
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

export function formatDateShort(d: string | Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(d))
}

export function monthName(month: number): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2024, month - 1, 1))
}

export function providerTypeBadge(type: string): { label: string; class: string } {
  const map: Record<string, { label: string; class: string }> = {
    API_SUSHI: { label: 'API SUSHI', class: 'badge-blue' },
    FILE_IMPORT: { label: 'Import fichier', class: 'badge-purple' },
    MANUAL: { label: 'Manuel', class: 'badge-gray' },
  }
  return map[type] ?? { label: type, class: 'badge-gray' }
}

export function statusBadge(status: string): { label: string; class: string } {
  const map: Record<string, { label: string; class: string }> = {
    SUCCESS: { label: 'Succès', class: 'badge-green' },
    PARTIAL: { label: 'Partiel', class: 'badge-yellow' },
    FAILED: { label: 'Échec', class: 'badge-red' },
    PENDING: { label: 'En cours', class: 'badge-blue' },
  }
  return map[status] ?? { label: status, class: 'badge-gray' }
}
