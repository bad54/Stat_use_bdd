import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query.year ? parseInt(String(query.year)) : new Date().getFullYear()
  const providerId = query.providerId ? String(query.providerId) : undefined
  const metricType = query.metricType ? String(query.metricType) : undefined

  const where = {
    year,
    ...(providerId ? { providerId } : {}),
    ...(metricType ? { metricType } : {}),
  }

  const prevYear = year - 1

  const [
    byMonth,
    byProvider,
    byPlatform,
    byMetricType,
    byMonthPrevYear,
    bySource,
  ] = await Promise.all([
    // Consultations par mois
    prisma.usageMetric.groupBy({
      by: ['month'],
      where,
      _sum: { consultations: true, searches: true, downloads: true },
      orderBy: { month: 'asc' },
    }),

    // Par fournisseur
    prisma.usageMetric.groupBy({
      by: ['providerId'],
      where,
      _sum: { consultations: true },
      orderBy: { _sum: { consultations: 'desc' } },
    }),

    // Top plateformes
    prisma.usageMetric.groupBy({
      by: ['platform'],
      where,
      _sum: { consultations: true },
      orderBy: { _sum: { consultations: 'desc' } },
      take: 10,
    }),

    // Par type de métrique
    prisma.usageMetric.groupBy({
      by: ['metricType'],
      where,
      _sum: { consultations: true },
      orderBy: { _sum: { consultations: 'desc' } },
    }),

    // Mois N-1 pour comparaison
    prisma.usageMetric.groupBy({
      by: ['month'],
      where: { ...where, year: prevYear },
      _sum: { consultations: true },
      orderBy: { month: 'asc' },
    }),

    // Par source (API vs fichier)
    prisma.usageMetric.groupBy({
      by: ['source'],
      where,
      _sum: { consultations: true },
    }),
  ])

  // Enrichir avec les noms de fournisseurs
  const providerIds = byProvider.map(p => p.providerId)
  const providers = await prisma.provider.findMany({
    where: { id: { in: providerIds } },
    select: { id: true, name: true },
  })
  const providerMap = Object.fromEntries(providers.map(p => [p.id, p.name]))

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

  // Construire les données par mois complètes (1-12)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const current = byMonth.find(b => b.month === m)
    const prev = byMonthPrevYear.find(b => b.month === m)
    return {
      month: m,
      label: monthNames[i],
      consultations: current?._sum.consultations ?? 0,
      searches: current?._sum.searches ?? 0,
      downloads: current?._sum.downloads ?? 0,
      prevYearConsultations: prev?._sum.consultations ?? 0,
    }
  })

  return {
    byMonth: monthlyData,
    byProvider: byProvider.map(p => ({
      providerId: p.providerId,
      providerName: providerMap[p.providerId] ?? 'Inconnu',
      consultations: p._sum.consultations ?? 0,
    })),
    topPlatforms: byPlatform.map(p => ({
      platform: p.platform,
      consultations: p._sum.consultations ?? 0,
    })),
    byMetricType: byMetricType.map(m => ({
      metricType: m.metricType,
      consultations: m._sum.consultations ?? 0,
    })),
    bySource: bySource.map(s => ({
      source: s.source,
      consultations: s._sum.consultations ?? 0,
    })),
    year,
    prevYear,
  }
})
