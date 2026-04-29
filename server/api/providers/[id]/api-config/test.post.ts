import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { resolveSecret } from '~/server/utils/secrets'
import { SushiService } from '~/server/services/sushi'

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

  const config = await prisma.providerApiConfig.findUnique({ where: { providerId: id } })
  if (!config) {
    throw createError({ statusCode: 404, message: 'Configuration API introuvable. Configurez d\'abord les paramètres.' })
  }

  const useMock = parsed.data.useMock || config.mockMode
  const beginDate = parsed.data.beginDate ?? config.defaultBeginDate ?? `${new Date().getFullYear()}-01`
  const endDate = parsed.data.endDate ?? config.defaultEndDate ?? `${new Date().getFullYear()}-12`
  const startTime = Date.now()

  // Mode mock : simulation sans appel réseau
  if (useMock) {
    const duration = Math.floor(Math.random() * 300) + 100
    const result = {
      success: true,
      mock: true,
      httpStatus: 200,
      duration,
      message: `Mode mock actif — Simulation d'une réponse SUSHI réussie (${config.reportType}). URL qui serait appelée : ${buildTestUrl(config, beginDate, endDate)}`,
      url: buildTestUrl(config, beginDate, endDate),
    }

    await updateTestStatus(id, 'SUCCESS', result.message)
    await logSync(id, config, beginDate, endDate, 'SUCCESS', 0, null, result.url, 200, duration, true)

    return result
  }

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
    timeoutMs: 15000,
  })

  const testResult = await service.fetchReport({
    reportType: config.reportType,
    beginDate,
    endDate,
  })

  const duration = testResult.duration ?? 0
  const status = testResult.success ? 'SUCCESS' : 'FAILED'
  const message = testResult.success
    ? `Connexion réussie — ${testResult.data?.length ?? 0} éléments reçus (HTTP ${testResult.rawStatus})`
    : `Échec — ${testResult.errors?.[0]?.message ?? 'Erreur inconnue'} (HTTP ${testResult.rawStatus ?? 'N/A'})`

  await updateTestStatus(id, status, message)

  const url = service.buildUrl(config.reportType, { reportType: config.reportType, beginDate, endDate })
  await logSync(id, config, beginDate, endDate, status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    testResult.data?.length ?? 0, testResult.errors?.[0]?.message ?? null, url, testResult.rawStatus ?? null, duration, false)

  return {
    success: testResult.success,
    mock: false,
    httpStatus: testResult.rawStatus,
    duration,
    message,
    url,
    errors: testResult.errors,
    itemCount: testResult.data?.length ?? 0,
  }
})

function buildTestUrl(config: { baseUrl: string; endpoint?: string | null; reportType: string; customerId?: string | null; requestorId?: string | null }, beginDate: string, endDate: string): string {
  const base = config.endpoint ? `${config.baseUrl}/${config.endpoint}` : config.baseUrl
  const url = new URL(`${base}/reports/${config.reportType.toLowerCase()}`)
  if (config.customerId) url.searchParams.set('customer_id', config.customerId)
  if (config.requestorId) url.searchParams.set('requestor_id', config.requestorId)
  url.searchParams.set('begin_date', beginDate)
  url.searchParams.set('end_date', endDate)
  return url.toString()
}

async function updateTestStatus(providerId: string, status: string, message: string) {
  await prisma.providerApiConfig.update({
    where: { providerId },
    data: { lastTestAt: new Date(), lastTestStatus: status, lastTestMessage: message },
  })
}

async function logSync(
  providerId: string,
  config: { reportType: string },
  beginDate: string,
  endDate: string,
  status: 'SUCCESS' | 'FAILED',
  rowsFetched: number,
  errorMessage: string | null,
  requestUrl: string | null,
  responseCode: number | null,
  duration: number,
  isMock: boolean
) {
  await prisma.apiSyncLog.create({
    data: {
      providerId,
      reportType: config.reportType,
      beginDate,
      endDate,
      status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      rowsFetched,
      errorMessage,
      requestUrl,
      responseCode,
      duration,
      isMock,
    },
  })
}
