/**
 * Service SUSHI COUNTER R5 / R5.1
 * Structure modulaire pour connecteurs API.
 * Appels réels nécessitent des clés API configurées dans .env.
 */

export interface SushiConfig {
  baseUrl: string
  customerId: string
  requestorId: string
  apiKey?: string
  instToken?: string
  extraHeaders?: Record<string, string>
  timeoutMs?: number
}

export interface SushiReportParams {
  reportType: string
  beginDate: string
  endDate: string
  attributes?: string[]
}

export interface SushiError {
  code: number
  severity: string
  message: string
  data?: string
}

export interface SushiResponse {
  success: boolean
  data?: unknown[]
  errors?: SushiError[]
  rawStatus?: number
  duration?: number
}

export class SushiService {
  private config: SushiConfig

  constructor(config: SushiConfig) {
    this.config = config
  }

  buildUrl(reportType: string, params: SushiReportParams): string {
    const url = new URL(`${this.config.baseUrl}/reports/${reportType.toLowerCase()}`)
    url.searchParams.set('customer_id', this.config.customerId)
    url.searchParams.set('requestor_id', this.config.requestorId)
    url.searchParams.set('begin_date', params.beginDate)
    url.searchParams.set('end_date', params.endDate)
    if (params.attributes?.length) {
      url.searchParams.set('attributes_to_show', params.attributes.join('|'))
    }
    return url.toString()
  }

  buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['X-ELS-APIKey'] = this.config.apiKey
    }
    if (this.config.instToken) {
      headers['X-ELS-Insttoken'] = this.config.instToken
    }

    return { ...headers, ...(this.config.extraHeaders ?? {}) }
  }

  async fetchReport(params: SushiReportParams): Promise<SushiResponse> {
    const url = this.buildUrl(params.reportType, params)
    const headers = this.buildHeaders()
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
      })

      const duration = Date.now() - startTime
      const contentType = response.headers.get('content-type') ?? ''

      if (!response.ok) {
        return {
          success: false,
          rawStatus: response.status,
          duration,
          errors: [{
            code: response.status,
            severity: 'Fatal',
            message: `HTTP ${response.status}: ${response.statusText}`,
          }],
        }
      }

      if (!contentType.includes('application/json')) {
        return {
          success: false,
          rawStatus: response.status,
          duration,
          errors: [{
            code: 1,
            severity: 'Fatal',
            message: `Réponse non-JSON reçue (${contentType}). Vérifiez l'URL et les credentials.`,
          }],
        }
      }

      const json = await response.json()

      // Détecter les erreurs SUSHI dans la réponse
      const sushiErrors = extractSushiErrors(json)
      if (sushiErrors.some(e => e.severity === 'Fatal')) {
        return { success: false, rawStatus: response.status, duration, errors: sushiErrors }
      }

      const data = extractReportData(json)
      return { success: true, data, rawStatus: response.status, duration, errors: sushiErrors }
    } catch (e) {
      const isTimeout = e instanceof Error && e.name === 'TimeoutError'
      return {
        success: false,
        duration: Date.now() - startTime,
        errors: [{
          code: -1,
          severity: 'Fatal',
          message: isTimeout
            ? `Timeout après ${this.config.timeoutMs ?? 30000}ms`
            : `Erreur de connexion: ${e instanceof Error ? e.message : String(e)}`,
        }],
      }
    }
  }
}

function extractSushiErrors(json: unknown): SushiError[] {
  if (!json || typeof json !== 'object') return []
  const obj = json as Record<string, unknown>
  const exceptions = obj['Exceptions'] ?? obj['exceptions'] ?? []
  if (!Array.isArray(exceptions)) return []
  return exceptions.map((ex: Record<string, unknown>) => ({
    code: Number(ex['Code'] ?? ex['code'] ?? 0),
    severity: String(ex['Severity'] ?? ex['severity'] ?? 'Warning'),
    message: String(ex['Message'] ?? ex['message'] ?? 'Erreur inconnue'),
    data: ex['Data'] ? String(ex['Data']) : undefined,
  }))
}

function extractReportData(json: unknown): unknown[] {
  if (!json || typeof json !== 'object') return []
  const obj = json as Record<string, unknown>
  const items = obj['Report_Items'] ?? obj['report_items'] ?? obj['Items'] ?? []
  return Array.isArray(items) ? items : []
}

// ─── Factories fournisseurs ───────────────────────────────────────────────────

export function createElsevierSushiService(params?: {
  apiKey?: string
  instToken?: string
  customerId?: string
}): SushiService {
  return new SushiService({
    baseUrl: process.env.ELSEVIER_SUSHI_URL ?? 'https://api.elsevier.com/analytics/scival/sushi/r51',
    customerId: params?.customerId ?? process.env.ELSEVIER_CUSTOMER_ID ?? '',
    requestorId: 'ICN Business School',
    apiKey: params?.apiKey ?? process.env.ELSEVIER_API_KEY,
    instToken: params?.instToken ?? process.env.ELSEVIER_INST_TOKEN,
    timeoutMs: 30000,
  })
}

export function createSageSushiService(params?: {
  customerId?: string
  requestorId?: string
}): SushiService {
  return new SushiService({
    baseUrl: process.env.SAGE_SUSHI_URL ?? 'https://sage.counter5.atypon-insights.com/sushi/r51',
    customerId: params?.customerId ?? process.env.SAGE_CUSTOMER_ID ?? '1000695009',
    requestorId: params?.requestorId ?? process.env.SAGE_REQUESTOR_ID ?? 'documentation@icn-artem.com',
    timeoutMs: 30000,
  })
}

export function createEbscoSushiService(): SushiService {
  return new SushiService({
    baseUrl: process.env.EBSCO_SUSHI_URL ?? 'https://cloud.ebsco.com/apps/counter-sushi',
    customerId: process.env.EBSCO_CUSTOMER_ID ?? '',
    requestorId: process.env.EBSCO_REQUESTOR_ID ?? 'ICN Business School',
    apiKey: process.env.EBSCO_API_KEY,
    timeoutMs: 30000,
  })
}

export function createProquestSushiService(): SushiService {
  return new SushiService({
    baseUrl: process.env.PROQUEST_SUSHI_URL ?? 'https://sushi.proquest.com/sushi/reports',
    customerId: process.env.PROQUEST_CUSTOMER_ID ?? '',
    requestorId: process.env.PROQUEST_REQUESTOR_ID ?? 'ICN Business School',
    apiKey: process.env.PROQUEST_API_KEY,
    timeoutMs: 30000,
  })
}
