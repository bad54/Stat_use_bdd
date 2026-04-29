import { describe, it, expect } from 'vitest'
import { parseCounterResponse, generateMockCounterResponse } from '~/server/utils/counter-parser'

describe('parseCounterResponse', () => {
  it('returns empty records for non-object input', () => {
    const result = parseCounterResponse(null, 'DR')
    expect(result.records).toHaveLength(0)
  })

  it('parses a minimal DR report', () => {
    const json = {
      Report_Items: [
        {
          Platform: 'TestPlatform',
          Database: 'TestDB',
          Performance: [
            {
              Period: { Begin_Date: '2024-01-01', End_Date: '2024-01-31' },
              Instance: [{ Metric_Type: 'Searches_Regular', Count: 42 }],
            },
          ],
        },
      ],
    }
    const result = parseCounterResponse(json, 'DR')
    expect(result.records.length).toBeGreaterThan(0)
    const rec = result.records[0]
    expect(rec.platform).toBe('TestPlatform')
    expect(rec.metricType).toBe('Searches_Regular')
    expect(rec.count).toBe(42)
    expect(rec.year).toBe(2024)
    expect(rec.month).toBe(1)
  })

  it('handles YYYY-MM date format in Period.Begin_Date', () => {
    const json = {
      Report_Items: [
        {
          Platform: 'P',
          Performance: [
            {
              Period: { Begin_Date: '2024-03', End_Date: '2024-03-31' },
              Instance: [{ Metric_Type: 'Total_Item_Requests', Count: 10 }],
            },
          ],
        },
      ],
    }
    const result = parseCounterResponse(json, 'DR')
    expect(result.records[0].month).toBe(3)
  })

  it('returns errors for malformed Report_Items', () => {
    const result = parseCounterResponse({ Report_Items: 'bad' }, 'DR')
    expect(result.records).toHaveLength(0)
  })
})

describe('generateMockCounterResponse', () => {
  it('generates a valid COUNTER-like structure', () => {
    const mock = generateMockCounterResponse({
      reportType: 'DR',
      platform: 'MockPlatform',
      beginDate: '2024-01',
      endDate: '2024-03',
    })
    expect(mock).toHaveProperty('Report_Items')
    const items = (mock as any).Report_Items
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('generates records parseable by parseCounterResponse', () => {
    const mock = generateMockCounterResponse({
      reportType: 'DR',
      platform: 'Test',
      beginDate: '2024-01',
      endDate: '2024-02',
    })
    const result = parseCounterResponse(mock, 'DR')
    expect(result.records.length).toBeGreaterThan(0)
    expect(result.errors).toHaveLength(0)
  })

  it('supports PR report type', () => {
    const mock = generateMockCounterResponse({
      reportType: 'PR',
      platform: 'TestPR',
      beginDate: '2024-01',
      endDate: '2024-01',
    })
    const result = parseCounterResponse(mock, 'PR')
    expect(result.records.length).toBeGreaterThan(0)
  })
})
