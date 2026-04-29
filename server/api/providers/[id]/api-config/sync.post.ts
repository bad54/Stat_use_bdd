import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { resolveSecret } from '~/server/utils/secrets'
import { SushiService } from '~/server/services/sushi'
import { parseCounterResponse, generateMockCounterResponse } from '~/server/utils/counter-parser'

const schema = z.object({
  beginDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  useMock: z.boolean().default(false),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const [provider, config] = await Promise.all([
    prisma.provider.findUnique({ where: { id } }),
    prisma.providerApiConfig.findUnique({ where: { providerId: id } }),
  ])

  if (!provider) throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  if (!config) throw createError({ statusCode: 404, message: 'Configuration API introuvable. Configurez d\'abord les paramètres API.' })

  const useMock = parsed.data.useMock || config.mockMode
  const beginDate = parsed.data.beginDate ?? config.defaultBeginDate ?? `${new Date().getFullYear()}-01`
  const endDate = parsed.data.endDate ?? config.defaultEndDate ?? `${new Date().getFullYear()}-12`
  const startTime = Date.now()

  let rawData: unknown
  let requestUrl: string | null = null
  let responseCode: number | null = null

  if (useMock) {
    // Générer des données mock réalistes
    rawData = generateMockCounterResponse({
      reportType: config.reportType,
      platform: provider.name,
      beginDate,
      endDate,
    })
    responseCode = 200
    requestUrl = `[MOCK] ${config.baseUrl}/reports/${config.reportType.toLowerCase()}`
  } else {
    // Appel réel
    const apiKey = resolveSecret(config.apiKeyEncoded)
    const token = resolveSecret(config.tokenEncoded)
    const extraHeaders = (config.headersJson as Record<string, string> | null) ?? {}

    const service = new SushiService({
      baseUrl: config.baseUrl,
      customerId: config.customerId ?? '',
      requestorId: config.requestorId ?? '',
      apiKey: apiKey ?? undefined,
      instToken: token ?? undefined,
      extraHeaders,
      timeoutMs: 30000,
    })

    requestUrl = service.buildUrl(config.reportType, { reportType: config.reportType, beginDate, endDate })
    const result = await service.fetchReport({ reportType: config.reportType, beginDate, endDate })
    responseCode = result.rawStatus ?? null

    if (!result.success) {
      const duration = Date.now() - startTime
      const errorMsg = result.errors?.[0]?.message ?? 'Erreur inconnue'
      await createFailedImport(id, config.reportType, requestUrl, responseCode, duration, errorMsg, isMock(useMock))
      await updateSyncStatus(id, 'FAILED')
      throw createError({ statusCode: 502, message: `Synchronisation échouée: ${errorMsg}` })
    }

    rawData = { Report_Items: result.data }
  }

  // Parser la réponse COUNTER
  const parseResult = parseCounterResponse(rawData, config.reportType)
  const duration = Date.now() - startTime

  if (parseResult.records.length === 0) {
    const errorMsg = parseResult.errors.length > 0
      ? parseResult.errors[0]
      : 'Aucune donnée reçue pour la période demandée.'

    await createFailedImport(id, config.reportType, requestUrl, responseCode, duration, errorMsg, isMock(useMock))
    await updateSyncStatus(id, 'FAILED')
    return {
      success: false,
      rowsImported: 0,
      message: errorMsg,
      errors: parseResult.errors,
      mock: useMock,
    }
  }

  // Créer l'entrée d'import
  const reportImport = await prisma.reportImport.create({
    data: {
      providerId: id,
      reportType: config.reportType,
      source: 'API',
      status: 'PENDING',
      rowsTotal: parseResult.records.length,
    },
  })

  // Insérer les métriques
  const toInsert = parseResult.records.map(r => ({
    providerId: id,
    importId: reportImport.id,
    platform: r.platform,
    databaseName: r.databaseName,
    title: r.title,
    reportType: r.reportType,
    metricType: r.metricType,
    year: r.year,
    month: r.month,
    period: r.period,
    consultations: r.count,
    source: 'API' as const,
  }))

  await prisma.usageMetric.createMany({ data: toInsert, skipDuplicates: false })

  // Mettre à jour l'import
  await prisma.reportImport.update({
    where: { id: reportImport.id },
    data: { status: 'SUCCESS', rowsImported: toInsert.length },
  })

  // Log API
  await prisma.apiSyncLog.create({
    data: {
      providerId: id,
      reportType: config.reportType,
      beginDate,
      endDate,
      status: 'SUCCESS',
      rowsFetched: toInsert.length,
      requestUrl,
      responseCode,
      duration,
      isMock: useMock,
    },
  })

  // Mettre à jour le statut de la config et du provider
  await Promise.all([
    updateSyncStatus(id, 'SUCCESS', toInsert.length),
    prisma.provider.update({ where: { id }, data: { lastSyncAt: new Date() } }),
  ])

  return {
    success: true,
    mock: useMock,
    rowsImported: toInsert.length,
    reportType: config.reportType,
    beginDate,
    endDate,
    duration,
    counterVersion: parseResult.releaseVersion,
    parseErrors: parseResult.errors,
    message: `${toInsert.length} métriques importées (${config.reportType}, ${beginDate} → ${endDate})${useMock ? ' [MODE MOCK]' : ''}`,
  }
})

function isMock(useMock: boolean) {
  return useMock
}

async function createFailedImport(
  providerId: string,
  reportType: string,
  requestUrl: string | null,
  responseCode: number | null,
  duration: number,
  errorMsg: string,
  isMock: boolean
) {
  await Promise.all([
    prisma.reportImport.create({
      data: { providerId, reportType, source: 'API', status: 'FAILED', rowsTotal: 0, errorMessage: errorMsg },
    }),
    prisma.apiSyncLog.create({
      data: {
        providerId,
        reportType,
        beginDate: '',
        endDate: '',
        status: 'FAILED',
        rowsFetched: 0,
        errorMessage: errorMsg,
        requestUrl,
        responseCode,
        duration,
        isMock,
      },
    }),
  ])
}

async function updateSyncStatus(providerId: string, status: string, rows?: number) {
  await prisma.providerApiConfig.update({
    where: { providerId },
    data: {
      lastSyncAt: new Date(),
      lastSyncStatus: status,
      ...(rows !== undefined ? { lastSyncRows: rows } : {}),
    },
  })
}
