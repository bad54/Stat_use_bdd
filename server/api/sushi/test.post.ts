import { z } from 'zod'
import { SushiService } from '~/server/services/sushi'

const schema = z.object({
  baseUrl: z.string().url(),
  customerId: z.string().min(1),
  requestorId: z.string().min(1),
  reportType: z.string().default('DR'),
  beginDate: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}$/),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const { baseUrl, customerId, requestorId, reportType, beginDate, endDate } = parsed.data

  const service = new SushiService({
    baseUrl,
    customerId,
    requestorId,
    timeoutMs: 10000,
  })

  const result = await service.fetchReport({
    reportType,
    beginDate,
    endDate,
  })

  return {
    url: service.buildUrl(reportType, { reportType, beginDate, endDate }),
    success: result.success,
    rowsFetched: result.data?.length ?? 0,
    errors: result.errors,
    duration: result.duration,
    httpStatus: result.rawStatus,
  }
})
