// ─── Fournisseurs ─────────────────────────────────────────────────────────────

export type ProviderType = 'API_SUSHI' | 'FILE_IMPORT' | 'MANUAL'
export type ImportSource = 'API' | 'FILE' | 'MANUAL'
export type ImportStatus = 'PENDING' | 'SUCCESS' | 'PARTIAL' | 'FAILED'

export interface Provider {
  id: string
  name: string
  code: string
  type: ProviderType
  apiUrl: string | null
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  lastSyncAt: string | null
  _count?: {
    usageMetrics: number
    reportImports: number
  }
}

export interface ProviderCredential {
  id: string
  providerId: string
  key: string
  value: string
  isSecret: boolean
}

// ─── Imports ──────────────────────────────────────────────────────────────────

export interface ReportImport {
  id: string
  providerId: string
  reportType: string
  source: ImportSource
  sourceFileName: string | null
  status: ImportStatus
  rowsImported: number
  rowsTotal: number
  errorMessage: string | null
  errorDetails: unknown
  createdAt: string
  updatedAt: string
  provider?: Pick<Provider, 'id' | 'name' | 'code'>
}

// ─── Métriques ─────────────────────────────────────────────────────────────────

export interface UsageMetric {
  id: string
  providerId: string
  importId: string | null
  platform: string
  databaseName: string | null
  title: string | null
  reportType: string
  metricType: string
  year: number
  month: number
  period: string
  consultations: number
  searches: number | null
  downloads: number | null
  source: ImportSource
  sourceFileName: string | null
  createdAt: string
  provider?: Pick<Provider, 'id' | 'name' | 'code'>
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

export interface FieldMapping {
  sourceColumn: string
  targetField: string
  transform?: string
}

export interface ImportMapping {
  id: string
  providerId: string
  reportType: string
  sourceColumn: string
  targetField: string
  transform: string | null
  isRequired: boolean
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalConsultations: number
  totalSearches: number
  totalDownloads: number
  activeProviders: number
  totalPlatforms: number
  evolution: number | null
  prevYearConsultations: number
  latestImport: {
    date: string
    provider: string
    status: ImportStatus
    rowsImported: number
  } | null
}

export interface MonthlyData {
  month: number
  label: string
  consultations: number
  searches: number
  downloads: number
  prevYearConsultations: number
}

export interface ProviderStats {
  providerId: string
  providerName: string
  consultations: number
}

export interface PlatformStats {
  platform: string
  consultations: number
}

export interface DashboardCharts {
  byMonth: MonthlyData[]
  byProvider: ProviderStats[]
  topPlatforms: PlatformStats[]
  byMetricType: { metricType: string; consultations: number }[]
  bySource: { source: string; consultations: number }[]
  year: number
  prevYear: number
}

// ─── Filtres dashboard ────────────────────────────────────────────────────────

export interface DashboardFilters {
  year?: number
  month?: number
  providerId?: string
  platform?: string
  metricType?: string
  reportType?: string
  source?: string
}

// ─── API Sync ─────────────────────────────────────────────────────────────────

export interface ApiSyncLog {
  id: string
  providerId: string
  reportType: string
  beginDate: string
  endDate: string
  status: ImportStatus
  rowsFetched: number
  errorMessage: string | null
  requestUrl: string | null
  responseCode: number | null
  duration: number | null
  createdAt: string
  provider?: Pick<Provider, 'id' | 'name' | 'code'>
}

// ─── Paramètres ───────────────────────────────────────────────────────────────

export interface AppSetting {
  id: string
  key: string
  value: string
  category: string
  label: string | null
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  filename: string
  headers: string[]
  preview: Record<string, unknown>[]
  totalRows: number
  parseErrors: string[]
  suggestedMapping: FieldMapping[]
  savedMappings: ImportMapping[]
  provider: Pick<Provider, 'id' | 'name'>
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
