import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const provider = await prisma.provider.findUnique({
    where: { id },
    select: { id: true, name: true, code: true, type: true },
  })
  if (!provider) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  const config = await prisma.providerApiConfig.findUnique({
    where: { providerId: id },
  })

  if (!config) {
    return { exists: false, provider }
  }

  // Ne jamais renvoyer les secrets encodés au frontend
  const { apiKeyEncoded, tokenEncoded, ...safeConfig } = config

  return {
    exists: true,
    provider,
    config: {
      ...safeConfig,
      // Indique si un secret est configuré sans l'exposer
      hasApiKey: !!apiKeyEncoded,
      hasToken: !!tokenEncoded,
    },
  }
})
