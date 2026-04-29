import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SushiService, createElsevierSushiService, createSageSushiService } from '../../server/services/sushi'

describe('SushiService', () => {
  const config = {
    baseUrl: 'https://api.example.com/sushi/r51',
    customerId: 'CUST_001',
    requestorId: 'test@example.com',
    timeoutMs: 5000,
  }

  it('builds correct URL with parameters', () => {
    const service = new SushiService(config)
    const url = service.buildUrl('DR', {
      reportType: 'DR',
      beginDate: '2024-01',
      endDate: '2024-12',
    })
    expect(url).toContain('/reports/dr')
    expect(url).toContain('customer_id=CUST_001')
    expect(url).toContain('begin_date=2024-01')
    expect(url).toContain('end_date=2024-12')
  })

  it('builds correct headers without API keys', () => {
    const service = new SushiService(config)
    const headers = service.buildHeaders()
    expect(headers['Accept']).toBe('application/json')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['X-ELS-APIKey']).toBeUndefined()
  })

  it('includes API key in headers when provided', () => {
    const service = new SushiService({ ...config, apiKey: 'test-key-123' })
    const headers = service.buildHeaders()
    expect(headers['X-ELS-APIKey']).toBe('test-key-123')
  })

  it('includes inst token in headers when provided', () => {
    const service = new SushiService({ ...config, instToken: 'token-xyz' })
    const headers = service.buildHeaders()
    expect(headers['X-ELS-Insttoken']).toBe('token-xyz')
  })

  describe('fetchReport with mocked fetch', () => {
    beforeEach(() => {
      vi.spyOn(global, 'fetch')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns success on valid JSON response', async () => {
      const mockData = {
        Report_Items: [
          { Database: 'Scopus', Metric_Type: 'Total_Item_Requests', Reporting_Period_Total: 1500 },
        ],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      } as Response)

      const service = new SushiService(config)
      const result = await service.fetchReport({ reportType: 'DR', beginDate: '2024-01', endDate: '2024-12' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.rawStatus).toBe(200)
    })

    it('returns error on HTTP 4xx', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response)

      const service = new SushiService(config)
      const result = await service.fetchReport({ reportType: 'DR', beginDate: '2024-01', endDate: '2024-12' })

      expect(result.success).toBe(false)
      expect(result.errors?.[0]?.code).toBe(401)
    })

    it('returns error when HTML response received', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html>Error Page</html>',
      } as Response)

      const service = new SushiService(config)
      const result = await service.fetchReport({ reportType: 'DR', beginDate: '2024-01', endDate: '2024-12' })

      expect(result.success).toBe(false)
      expect(result.errors?.[0]?.message).toContain('non-JSON')
    })

    it('returns error on network timeout', async () => {
      vi.mocked(fetch).mockRejectedValue(
        Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' })
      )

      const service = new SushiService({ ...config, timeoutMs: 100 })
      const result = await service.fetchReport({ reportType: 'DR', beginDate: '2024-01', endDate: '2024-12' })

      expect(result.success).toBe(false)
      expect(result.errors?.[0]?.message).toContain('Timeout')
    })

    it('handles SUSHI fatal exceptions in response body', async () => {
      const responseWithError = {
        Exceptions: [
          { Code: 2040, Severity: 'Fatal', Message: 'Invalid credentials.' },
        ],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseWithError,
      } as Response)

      const service = new SushiService(config)
      const result = await service.fetchReport({ reportType: 'DR', beginDate: '2024-01', endDate: '2024-12' })

      expect(result.success).toBe(false)
      expect(result.errors?.[0]?.code).toBe(2040)
    })
  })
})

describe('createElsevierSushiService', () => {
  it('creates service with correct base URL', () => {
    const service = createElsevierSushiService()
    const url = service.buildUrl('DR', { reportType: 'DR', beginDate: '2024-01', endDate: '2024-12' })
    expect(url).toContain('elsevier')
  })
})

describe('createSageSushiService', () => {
  it('creates service with Sage URL', () => {
    const service = createSageSushiService({ customerId: '1000695009' })
    const url = service.buildUrl('TR_J1', { reportType: 'TR_J1', beginDate: '2024-01', endDate: '2024-12' })
    expect(url).toContain('tr_j1')
    expect(url).toContain('1000695009')
  })
})
