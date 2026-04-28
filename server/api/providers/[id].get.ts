import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      _count: { select: { usageMetrics: true, reportImports: true } },
      reportImports: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      importMappings: { orderBy: { reportType: 'asc' } },
    },
  })

  if (!provider) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  return provider
})
