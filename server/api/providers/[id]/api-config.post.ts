import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { prepareSecret } from '~/server/utils/secrets'

const schema = z.object({
  apiType: z.string().default('SUSHI_R51'),
  counterVersion: z.string().default('5.1'),
  baseUrl: z.string().url('URL de base invalide'),
  fallbackUrl: z.string().url().optional().nullable(),
  endpoint: z.string().optional().nullable(),
  reportType: z.string().default('DR'),
  customerId: z.string().optional().nullable(),
  requestorId: z.string().optional().nullable(),
  // Valeur en clair envoyée depuis le formulaire (vide = pas de changement)
  apiKeyPlain: z.string().optional().nullable(),
  tokenPlain: z.string().optional().nullable(),
  headersJson: z.record(z.string()).optional().nullable(),
  queryParamsJson: z.record(z.string()).optional().nullable(),
  defaultBeginDate: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable(),
  defaultEndDate: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable(),
  mockMode: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const provider = await prisma.provider.findUnique({ where: { id } })
  if (!provider) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  const { apiKeyPlain, tokenPlain, ...rest } = parsed.data

  // Préparer les secrets uniquement si une nouvelle valeur est fournie
  const apiKeyData = prepareSecret(apiKeyPlain)
  const tokenData = prepareSecret(tokenPlain)

  const existing = await prisma.providerApiConfig.findUnique({ where: { providerId: id } })

  const data = {
    ...rest,
    providerId: id,
    // Mettre à jour les secrets seulement si une nouvelle valeur est fournie
    ...(apiKeyData ? { apiKeyEncoded: apiKeyData.encoded, apiKeyMasked: apiKeyData.masked } : {}),
    ...(tokenData ? { tokenEncoded: tokenData.encoded, tokenMasked: tokenData.masked } : {}),
  }

  let config
  if (existing) {
    config = await prisma.providerApiConfig.update({ where: { providerId: id }, data })
  } else {
    config = await prisma.providerApiConfig.create({ data })
  }

  // Mettre à jour l'URL sur le provider parent
  await prisma.provider.update({
    where: { id },
    data: { apiUrl: parsed.data.baseUrl },
  })

  const { apiKeyEncoded, tokenEncoded, ...safeConfig } = config
  return {
    config: {
      ...safeConfig,
      hasApiKey: !!apiKeyEncoded,
      hasToken: !!tokenEncoded,
    },
  }
})
