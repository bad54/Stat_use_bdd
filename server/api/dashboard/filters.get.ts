import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const [providers, platforms, metricTypes, reportTypes, years] = await Promise.all([
    prisma.provider.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prisma.usageMetric.groupBy({
      by: ['platform'],
      orderBy: { platform: 'asc' },
    }).then(r => r.map(p => p.platform)),
    prisma.usageMetric.groupBy({
      by: ['metricType'],
      orderBy: { metricType: 'asc' },
    }).then(r => r.map(m => m.metricType)),
    prisma.usageMetric.groupBy({
      by: ['reportType'],
      orderBy: { reportType: 'asc' },
    }).then(r => r.map(t => t.reportType)),
    prisma.usageMetric.groupBy({
      by: ['year'],
      orderBy: { year: 'desc' },
    }).then(r => r.map(y => y.year)),
  ])

  return { providers, platforms, metricTypes, reportTypes, years }
})
