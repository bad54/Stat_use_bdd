import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const year = query.year ? parseInt(String(query.year)) : undefined

  const provider = await prisma.provider.findUnique({ where: { id } })
  if (!provider) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  const where = { providerId: id, ...(year ? { year } : {}) }

  const [totals, byMonth, byPlatform, recentImports] = await Promise.all([
    prisma.usageMetric.aggregate({
      where,
      _sum: { consultations: true, searches: true, downloads: true },
    }),
    prisma.usageMetric.groupBy({
      by: ['year', 'month'],
      where,
      _sum: { consultations: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    }),
    prisma.usageMetric.groupBy({
      by: ['platform'],
      where,
      _sum: { consultations: true },
      orderBy: { _sum: { consultations: 'desc' } },
      take: 5,
    }),
    prisma.reportImport.findMany({
      where: { providerId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const prevYearTotals = year
    ? await prisma.usageMetric.aggregate({
        where: { providerId: id, year: year - 1 },
        _sum: { consultations: true },
      })
    : null

  return {
    provider: { id: provider.id, name: provider.name, code: provider.code },
    totals: {
      consultations: totals._sum.consultations ?? 0,
      searches: totals._sum.searches ?? 0,
      downloads: totals._sum.downloads ?? 0,
    },
    byMonth,
    topPlatforms: byPlatform.map(p => ({
      platform: p.platform,
      consultations: p._sum.consultations ?? 0,
    })),
    recentImports,
    prevYearConsultations: prevYearTotals?._sum.consultations ?? null,
  }
})
