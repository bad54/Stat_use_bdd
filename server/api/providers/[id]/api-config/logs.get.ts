import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const limit = Math.min(50, parseInt(String(query.limit ?? '20'), 10))

  const provider = await prisma.provider.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!provider) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  const logs = await prisma.apiSyncLog.findMany({
    where: { providerId: id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return logs
})
