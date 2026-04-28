import type { ParsedRow } from './parsers'

export interface FieldMapping {
  sourceColumn: string
  targetField: string
  transform?: string
}

export interface MappedRecord {
  provider?: string
  platform?: string
  databaseName?: string
  title?: string
  reportType?: string
  metricType?: string
  year?: number
  month?: number
  period?: string
  consultations?: number
  searches?: number
  downloads?: number
  source?: string
  sourceFileName?: string
  [key: string]: unknown
}

export interface MappingResult {
  records: MappedRecord[]
  skipped: number
  errors: string[]
}

export function applyMapping(rows: ParsedRow[], mappings: FieldMapping[]): MappingResult {
  const records: MappedRecord[] = []
  const errors: string[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const record: MappedRecord = {}
    let hasError = false

    for (const mapping of mappings) {
      const rawValue = row[mapping.sourceColumn]

      if (rawValue === null || rawValue === undefined || rawValue === '') {
        if (isRequiredField(mapping.targetField)) {
          errors.push(`Ligne ${i + 2}: Champ requis "${mapping.sourceColumn}" manquant.`)
          hasError = true
        }
        continue
      }

      record[mapping.targetField] = transformValue(String(rawValue), mapping.targetField, mapping.transform)
    }

    if (hasError) {
      skipped++
    } else {
      // Dériver year et month depuis period si nécessaire
      if (record.period && typeof record.period === 'string' && !record.year) {
        const parsed = parsePeriod(record.period)
        if (parsed) {
          record.year = parsed.year
          record.month = parsed.month
        }
      }

      if (record.year && record.month && !record.period) {
        record.period = `${record.year}-${String(record.month).padStart(2, '0')}`
      }

      records.push(record)
    }
  }

  return { records, skipped, errors }
}

function isRequiredField(field: string): boolean {
  return ['platform', 'metricType', 'period', 'consultations'].includes(field)
}

function transformValue(value: string, targetField: string, transform?: string): unknown {
  if (transform === 'integer' || isNumericField(targetField)) {
    const num = parseInt(value.replace(/[^0-9-]/g, ''), 10)
    return isNaN(num) ? 0 : num
  }

  if (transform === 'year') {
    return parseInt(value, 10)
  }

  if (transform === 'month') {
    return parseInt(value, 10)
  }

  if (transform === 'period') {
    return parsePeriod(value) ? value : null
  }

  return value.trim()
}

function isNumericField(field: string): boolean {
  return ['consultations', 'searches', 'downloads', 'year', 'month'].includes(field)
}

function parsePeriod(period: string): { year: number; month: number } | null {
  // Support formats: YYYY-MM, MM/YYYY, YYYY/MM, Jan-2024, etc.
  const isoMatch = period.match(/^(\d{4})-(\d{2})$/)
  if (isoMatch) {
    return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]) }
  }

  const slashMatch = period.match(/^(\d{2})\/(\d{4})$/)
  if (slashMatch) {
    return { year: parseInt(slashMatch[2]), month: parseInt(slashMatch[1]) }
  }

  const yearMonthMatch = period.match(/^(\d{4})\/(\d{2})$/)
  if (yearMonthMatch) {
    return { year: parseInt(yearMonthMatch[1]), month: parseInt(yearMonthMatch[2]) }
  }

  return null
}

export function guessMapping(headers: string[]): FieldMapping[] {
  const mappings: FieldMapping[] = []

  const fieldPatterns: Record<string, RegExp[]> = {
    platform: [/^platform$/i, /^plateforme$/i],
    databaseName: [/^database$/i, /^database_name$/i, /^db$/i, /^revue$/i, /^titre$/i, /^resource$/i],
    title: [/^title$/i, /^titre$/i, /^journal$/i],
    metricType: [/^metric_type$/i, /^type.*m[ée]trique$/i, /^metrique$/i],
    period: [/^period$/i, /^p[ée]riode$/i, /^reporting_period$/i, /^date$/i, /^mois$/i],
    reportType: [/^report_type$/i, /^type.*rapport$/i, /^rapport$/i],
    year: [/^year$/i, /^ann[ée]e$/i],
    month: [/^month$/i, /^mois$/i, /^num[ée]ro_mois$/i],
    consultations: [/^(total_item_requests|consultations|total_count|reporting_period_total|count)$/i],
    searches: [/^(searches|recherches|total.*search)$/i],
    downloads: [/^(downloads|t[ée]l[ée]chargements|total.*download)$/i],
  }

  for (const header of headers) {
    for (const [targetField, patterns] of Object.entries(fieldPatterns)) {
      if (patterns.some(p => p.test(header))) {
        if (!mappings.find(m => m.targetField === targetField)) {
          mappings.push({ sourceColumn: header, targetField })
        }
        break
      }
    }
  }

  return mappings
}
