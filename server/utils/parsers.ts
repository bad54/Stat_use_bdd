import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedRow {
  [key: string]: string | number | null
}

export interface ParseResult {
  headers: string[]
  rows: ParsedRow[]
  totalRows: number
  errors: string[]
}

export function parseCSV(content: string, delimiter = ','): ParseResult {
  const errors: string[] = []

  const result = Papa.parse<ParsedRow>(content, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  })

  if (result.errors.length > 0) {
    errors.push(...result.errors.map(e => `Ligne ${e.row}: ${e.message}`))
  }

  return {
    headers: result.meta.fields ?? [],
    rows: result.data,
    totalRows: result.data.length,
    errors,
  }
}

export function parseTSV(content: string): ParseResult {
  return parseCSV(content, '\t')
}

export function parseXLSX(buffer: Buffer): ParseResult {
  const errors: string[] = []

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      return { headers: [], rows: [], totalRows: 0, errors: ['Aucune feuille trouvée dans le fichier.'] }
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
      defval: null,
      raw: false,
    })

    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []

    return {
      headers,
      rows: jsonData,
      totalRows: jsonData.length,
      errors,
    }
  } catch (e) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      errors: [`Erreur lors de la lecture du fichier Excel: ${e instanceof Error ? e.message : 'Erreur inconnue'}`],
    }
  }
}

export function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] ?? ''
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  const semicolonCount = (firstLine.match(/;/g) ?? []).length
  const commaCount = (firstLine.match(/,/g) ?? []).length

  if (tabCount > semicolonCount && tabCount > commaCount) return '\t'
  if (semicolonCount > commaCount) return ';'
  return ','
}
