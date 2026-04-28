import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const isActive = query.active !== undefined ? query.active === 'true' : undefined

  const providers = await prisma.provider.findMany({
    where: isActive !== undefined ? { isActive } : undefined,
    include: {
      _count: {
        select: {
          usageMetrics: true,
          reportImports: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return providers
})
