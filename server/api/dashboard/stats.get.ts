import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query.year ? parseInt(String(query.year)) : undefined
  const providerId = query.providerId ? String(query.providerId) : undefined

  const where = {
    ...(year ? { year } : {}),
    ...(providerId ? { providerId } : {}),
  }

  const [
    totalConsultations,
    totalSearches,
    totalDownloads,
    activeProviders,
    totalPlatforms,
    latestImport,
    prevYearConsultations,
  ] = await Promise.all([
    prisma.usageMetric.aggregate({ where, _sum: { consultations: true } }),
    prisma.usageMetric.aggregate({ where, _sum: { searches: true } }),
    prisma.usageMetric.aggregate({ where, _sum: { downloads: true } }),
    prisma.provider.count({ where: { isActive: true } }),
    prisma.usageMetric.groupBy({
      by: ['platform'],
      where,
      _count: true,
    }).then(r => r.length),
    prisma.reportImport.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { provider: { select: { name: true } } },
    }),
    year
      ? prisma.usageMetric.aggregate({
          where: { ...where, year: year - 1 },
          _sum: { consultations: true },
        })
      : Promise.resolve({ _sum: { consultations: null } }),
  ])

  const currentConsultations = totalConsultations._sum.consultations ?? 0
  const prevConsultations = prevYearConsultations._sum.consultations ?? 0
  const evolution = prevConsultations > 0
    ? Math.round(((currentConsultations - prevConsultations) / prevConsultations) * 100)
    : null

  return {
    totalConsultations: currentConsultations,
    totalSearches: totalSearches._sum.searches ?? 0,
    totalDownloads: totalDownloads._sum.downloads ?? 0,
    activeProviders,
    totalPlatforms,
    evolution,
    prevYearConsultations: prevConsultations,
    latestImport: latestImport
      ? {
          date: latestImport.createdAt,
          provider: latestImport.provider.name,
          status: latestImport.status,
          rowsImported: latestImport.rowsImported,
        }
      : null,
  }
})
