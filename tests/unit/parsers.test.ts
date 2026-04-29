import { describe, it, expect } from 'vitest'
import { parseCSV, parseTSV, parseXLSX, detectDelimiter } from '../../server/utils/parsers'
import * as XLSX from 'xlsx'

describe('parseCSV', () => {
  it('parses a simple CSV with headers', () => {
    const csv = `Platform,Metric_Type,Period,Consultations
ScienceDirect,Total_Item_Requests,2024-01,1500
Scopus,Total_Item_Requests,2024-02,2300`

    const result = parseCSV(csv)
    expect(result.headers).toEqual(['Platform', 'Metric_Type', 'Period', 'Consultations'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]['Platform']).toBe('ScienceDirect')
    expect(result.rows[0]['Consultations']).toBe('1500')
    expect(result.errors).toHaveLength(0)
    expect(result.totalRows).toBe(2)
  })

  it('trims headers and values', () => {
    const csv = `  Platform ,  Count \nScopus,100`
    const result = parseCSV(csv)
    expect(result.headers[0]).toBe('Platform')
    expect(result.headers[1]).toBe('Count')
  })

  it('handles empty content', () => {
    const result = parseCSV('')
    expect(result.rows).toHaveLength(0)
  })

  it('handles semicolon delimiter', () => {
    const csv = `Platform;Count\nScopus;100`
    const result = parseCSV(csv, ';')
    expect(result.headers).toEqual(['Platform', 'Count'])
    expect(result.rows[0]['Count']).toBe('100')
  })
})

describe('parseTSV', () => {
  it('parses TSV content correctly', () => {
    const tsv = `Platform\tMetric\tCount\nScopus\tTotal\t500`
    const result = parseTSV(tsv)
    expect(result.headers).toEqual(['Platform', 'Metric', 'Count'])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]['Count']).toBe('500')
  })
})

describe('parseXLSX', () => {
  it('parses Excel buffer', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Platform', 'Metric_Type', 'Consultations'],
      ['Cairn.info', 'Total_Item_Requests', 800],
      ['Scopus', 'Unique_Item_Requests', 200],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

    const result = parseXLSX(buffer)
    expect(result.headers).toEqual(['Platform', 'Metric_Type', 'Consultations'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]['Platform']).toBe('Cairn.info')
    expect(result.errors).toHaveLength(0)
  })

  it('returns a result without crashing for arbitrary buffer', () => {
    // xlsx is very permissive — it may parse arbitrary data as an empty workbook
    // The function should not throw regardless of input
    const result = parseXLSX(Buffer.from('not an excel file'))
    expect(result).toHaveProperty('headers')
    expect(result).toHaveProperty('rows')
    expect(result).toHaveProperty('errors')
  })
})

describe('detectDelimiter', () => {
  it('detects comma delimiter', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
  })

  it('detects tab delimiter', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
  })

  it('detects semicolon delimiter', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
  })
})
