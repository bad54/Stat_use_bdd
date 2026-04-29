/**
 * Parseur de réponses COUNTER R5 / R5.1
 * Transforme les Report_Items JSON en UsageMetric normalisés.
 */

export interface CounterRecord {
  platform: string
  databaseName: string | null
  title: string | null
  publisher: string | null
  reportType: string
  metricType: string
  year: number
  month: number
  period: string
  count: number
}

export interface ParseCounterResult {
  records: CounterRecord[]
  reportType: string
  releaseVersion: string
  errors: string[]
}

/**
 * Parse une réponse JSON COUNTER R5/R5.1 complète.
 */
export function parseCounterResponse(
  json: unknown,
  reportType: string
): ParseCounterResult {
  const errors: string[] = []
  const records: CounterRecord[] = []

  if (!json || typeof json !== 'object') {
    return { records, reportType, releaseVersion: 'unknown', errors: ['Réponse JSON invalide ou vide.'] }
  }

  const obj = json as Record<string, unknown>

  // Extraire la version COUNTER
  const header = obj['Report_Header'] as Record<string, unknown> | undefined
  const releaseVersion = String(header?.['Release'] ?? header?.['release'] ?? '5.1')

  // Extraire les items
  const items = obj['Report_Items'] ?? obj['report_items'] ?? []
  if (!Array.isArray(items)) {
    return { records, reportType, releaseVersion, errors: ['Champ Report_Items manquant ou invalide.'] }
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>
    if (!item || typeof item !== 'object') continue

    const platform = String(item['Platform'] ?? item['platform'] ?? '')
    const databaseName = item['Database'] ? String(item['Database']) : null
    const title = item['Title'] ? String(item['Title']) : null
    const publisher = item['Publisher'] ? String(item['Publisher']) : null

    const performances = item['Performance'] ?? item['performance'] ?? []
    if (!Array.isArray(performances)) continue

    for (const perf of performances) {
      const p = perf as Record<string, unknown>
      const period = p['Period'] as Record<string, unknown> | undefined
      if (!period) continue

      const beginDate = String(period['Begin_Date'] ?? period['begin_date'] ?? '')
      const parsed = parseDateToPeriod(beginDate)
      if (!parsed) {
        errors.push(`Item ${i}: date invalide "${beginDate}"`)
        continue
      }

      const instances = p['Instance'] ?? p['instance'] ?? []
      if (!Array.isArray(instances)) continue

      for (const inst of instances) {
        const ins = inst as Record<string, unknown>
        const metricType = String(ins['Metric_Type'] ?? ins['metric_type'] ?? '')
        const count = Number(ins['Count'] ?? ins['count'] ?? 0)

        if (!metricType) continue

        records.push({
          platform: platform || databaseName || title || 'Inconnu',
          databaseName,
          title,
          publisher,
          reportType,
          metricType,
          year: parsed.year,
          month: parsed.month,
          period: parsed.period,
          count,
        })
      }
    }
  }

  return { records, reportType, releaseVersion, errors }
}

function parseDateToPeriod(dateStr: string): { year: number; month: number; period: string } | null {
  // Formats: 2024-01-01, 2024-01, 2024/01
  const match = dateStr.match(/^(\d{4})[-\/](\d{2})/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null
  return { year, month, period: `${year}-${String(month).padStart(2, '0')}` }
}

/**
 * Génère une réponse COUNTER mock pour les tests.
 */
export function generateMockCounterResponse(opts: {
  reportType: string
  platform: string
  beginDate: string
  endDate: string
  metrics?: string[]
}): unknown {
  const metrics = opts.metrics ?? ['Total_Item_Requests', 'Unique_Item_Requests']
  const periods = generatePeriods(opts.beginDate, opts.endDate)

  return {
    Report_Header: {
      Release: '5.1',
      Report_ID: opts.reportType,
      Report_Name: `${opts.reportType} Mock Report`,
      Created: new Date().toISOString(),
      Created_By: 'ICN Dashboard Mock',
    },
    Report_Items: [
      {
        Database: `${opts.platform} Database`,
        Publisher: 'Mock Publisher',
        Platform: opts.platform,
        Performance: periods.map(period => ({
          Period: {
            Begin_Date: `${period}-01`,
            End_Date: `${period}-28`,
          },
          Instance: metrics.map(mt => ({
            Metric_Type: mt,
            Count: Math.floor(Math.random() * 1000) + 100,
          })),
        })),
      },
      {
        Database: `${opts.platform} Journals`,
        Publisher: 'Mock Publisher',
        Platform: opts.platform,
        Performance: periods.map(period => ({
          Period: {
            Begin_Date: `${period}-01`,
            End_Date: `${period}-28`,
          },
          Instance: metrics.map(mt => ({
            Metric_Type: mt,
            Count: Math.floor(Math.random() * 500) + 50,
          })),
        })),
      },
    ],
  }
}

function generatePeriods(begin: string, end: string): string[] {
  const periods: string[] = []
  const [by, bm] = begin.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  if (!by || !bm || !ey || !em) return []

  let y = by, m = bm
  let safety = 0
  while ((y < ey || (y === ey && m <= em)) && safety < 36) {
    periods.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
    safety++
  }
  return periods
}
