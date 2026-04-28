import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10))
  const limit = Math.min(50, parseInt(String(query.limit ?? '20'), 10))
  const providerId = query.providerId ? String(query.providerId) : undefined
  const status = query.status ? String(query.status) : undefined

  const where = {
    ...(providerId ? { providerId } : {}),
    ...(status ? { status: status as any } : {}),
  }

  const [imports, total] = await Promise.all([
    prisma.reportImport.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reportImport.count({ where }),
  ])

  return {
    data: imports,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
