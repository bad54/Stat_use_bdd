import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { parseCSV, parseTSV, parseXLSX, detectDelimiter } from '~/server/utils/parsers'
import { applyMapping } from '~/server/utils/mapping'
import type { FieldMapping } from '~/server/utils/mapping'

const schema = z.object({
  providerId: z.string().min(1),
  reportType: z.string().default('DR'),
  mapping: z.array(z.object({
    sourceColumn: z.string(),
    targetField: z.string(),
    transform: z.string().optional(),
  })),
  fileContent: z.string().min(1),
  filename: z.string().default('upload'),
  fileType: z.enum(['csv', 'tsv', 'xlsx']).default('csv'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const { providerId, reportType, mapping, fileContent, filename, fileType } = parsed.data

  const provider = await prisma.provider.findUnique({ where: { id: providerId } })
  if (!provider) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  // Parser le contenu
  let parseResult
  if (fileType === 'xlsx') {
    parseResult = parseXLSX(Buffer.from(fileContent, 'base64'))
  } else if (fileType === 'tsv') {
    parseResult = parseTSV(fileContent)
  } else {
    const delimiter = detectDelimiter(fileContent)
    parseResult = parseCSV(fileContent, delimiter)
  }

  if (parseResult.rows.length === 0) {
    throw createError({ statusCode: 422, message: 'Aucune donnée valide trouvée dans le fichier.' })
  }

  // Appliquer le mapping
  const mappingResult = applyMapping(parseResult.rows, mapping as FieldMapping[])

  // Créer l'import
  const reportImport = await prisma.reportImport.create({
    data: {
      providerId,
      reportType,
      source: 'FILE',
      sourceFileName: filename,
      status: mappingResult.skipped > 0 ? 'PARTIAL' : 'SUCCESS',
      rowsTotal: parseResult.totalRows,
      rowsImported: mappingResult.records.length,
      errorMessage: mappingResult.errors.length > 0
        ? `${mappingResult.skipped} ligne(s) ignorée(s): ${mappingResult.errors.slice(0, 3).join('; ')}`
        : null,
    },
  })

  // Insérer les métriques
  const toInsert = mappingResult.records
    .filter(r => r.platform && r.year && r.month && r.period)
    .map(r => ({
      providerId,
      importId: reportImport.id,
      platform: String(r.platform ?? ''),
      databaseName: r.databaseName ? String(r.databaseName) : null,
      title: r.title ? String(r.title) : null,
      reportType,
      metricType: String(r.metricType ?? 'Total_Item_Requests'),
      year: Number(r.year),
      month: Number(r.month),
      period: String(r.period ?? ''),
      consultations: Number(r.consultations ?? 0),
      searches: r.searches != null ? Number(r.searches) : null,
      downloads: r.downloads != null ? Number(r.downloads) : null,
      source: 'FILE' as const,
      sourceFileName: filename,
    }))

  if (toInsert.length > 0) {
    await prisma.usageMetric.createMany({ data: toInsert })
  }

  // Mettre à jour le statut de l'import
  await prisma.reportImport.update({
    where: { id: reportImport.id },
    data: {
      rowsImported: toInsert.length,
      status: toInsert.length === 0 ? 'FAILED' : mappingResult.skipped > 0 ? 'PARTIAL' : 'SUCCESS',
    },
  })

  // Mettre à jour lastSyncAt du fournisseur
  await prisma.provider.update({
    where: { id: providerId },
    data: { lastSyncAt: new Date() },
  })

  setResponseStatus(event, 201)
  return {
    importId: reportImport.id,
    rowsTotal: parseResult.totalRows,
    rowsImported: toInsert.length,
    rowsSkipped: mappingResult.skipped,
    errors: mappingResult.errors.slice(0, 10),
    status: reportImport.status,
  }
})
