import { describe, it, expect } from 'vitest'
import { applyMapping, guessMapping } from '../../server/utils/mapping'
import type { FieldMapping } from '../../server/utils/mapping'

describe('applyMapping', () => {
  const rows = [
    { Platform: 'Scopus', Metric_Type: 'Total_Item_Requests', Period: '2024-01', Consultations: '1500', Searches: '400' },
    { Platform: 'ScienceDirect', Metric_Type: 'Unique_Item_Requests', Period: '2024-02', Consultations: '800', Searches: '200' },
  ]

  const mappings: FieldMapping[] = [
    { sourceColumn: 'Platform', targetField: 'platform' },
    { sourceColumn: 'Metric_Type', targetField: 'metricType' },
    { sourceColumn: 'Period', targetField: 'period' },
    { sourceColumn: 'Consultations', targetField: 'consultations' },
    { sourceColumn: 'Searches', targetField: 'searches' },
  ]

  it('maps all columns correctly', () => {
    const result = applyMapping(rows, mappings)
    expect(result.records).toHaveLength(2)
    expect(result.records[0].platform).toBe('Scopus')
    expect(result.records[0].metricType).toBe('Total_Item_Requests')
    expect(result.records[0].period).toBe('2024-01')
    expect(result.skipped).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('derives year and month from period', () => {
    const result = applyMapping(rows, mappings)
    expect(result.records[0].year).toBe(2024)
    expect(result.records[0].month).toBe(1)
    expect(result.records[1].year).toBe(2024)
    expect(result.records[1].month).toBe(2)
  })

  it('converts consultations to number', () => {
    const result = applyMapping(rows, mappings)
    expect(typeof result.records[0].consultations).toBe('number')
    expect(result.records[0].consultations).toBe(1500)
  })

  it('skips rows with missing required fields', () => {
    const badRows = [
      { Platform: '', Metric_Type: 'Total_Item_Requests', Period: '2024-01', Consultations: '100' },
    ]
    const result = applyMapping(badRows, mappings)
    expect(result.skipped).toBe(1)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles empty mapping gracefully', () => {
    const result = applyMapping(rows, [])
    expect(result.records).toHaveLength(2)
    expect(result.skipped).toBe(0)
  })
})

describe('guessMapping', () => {
  it('detects standard COUNTER columns', () => {
    const headers = ['Platform', 'Metric_Type', 'Reporting_Period_Total', 'Database']
    const mapping = guessMapping(headers)
    const platformMapping = mapping.find(m => m.targetField === 'platform')
    const metricMapping = mapping.find(m => m.targetField === 'metricType')
    const consultationMapping = mapping.find(m => m.targetField === 'consultations')

    expect(platformMapping?.sourceColumn).toBe('Platform')
    expect(metricMapping?.sourceColumn).toBe('Metric_Type')
    expect(consultationMapping?.sourceColumn).toBe('Reporting_Period_Total')
  })

  it('detects French column names', () => {
    const headers = ['Plateforme', 'Type de métrique', 'Consultations', 'Période']
    const mapping = guessMapping(headers)
    const platformMapping = mapping.find(m => m.targetField === 'platform')
    expect(platformMapping?.sourceColumn).toBe('Plateforme')
  })

  it('returns empty array for unrecognized headers', () => {
    const headers = ['Col1', 'Col2', 'Col3']
    const mapping = guessMapping(headers)
    expect(mapping).toHaveLength(0)
  })
})
