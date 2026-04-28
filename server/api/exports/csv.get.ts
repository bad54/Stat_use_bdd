import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = query.year ? parseInt(String(query.year)) : undefined
  const month = query.month ? parseInt(String(query.month)) : undefined
  const providerId = query.providerId ? String(query.providerId) : undefined
  const platform = query.platform ? String(query.platform) : undefined
  const metricType = query.metricType ? String(query.metricType) : undefined
  const reportType = query.reportType ? String(query.reportType) : undefined
  const source = query.source ? String(query.source) : undefined

  const where = {
    ...(year ? { year } : {}),
    ...(month ? { month } : {}),
    ...(providerId ? { providerId } : {}),
    ...(platform ? { platform } : {}),
    ...(metricType ? { metricType } : {}),
    ...(reportType ? { reportType } : {}),
    ...(source ? { source: source as any } : {}),
  }

  const metrics = await prisma.usageMetric.findMany({
    where,
    include: {
      provider: { select: { name: true, code: true } },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { platform: 'asc' }],
    take: 50000,
  })

  // Générer le CSV
  const headers = [
    'Fournisseur',
    'Code fournisseur',
    'Plateforme',
    'Base de données',
    'Titre',
    'Type de rapport',
    'Type de métrique',
    'Année',
    'Mois',
    'Période',
    'Consultations',
    'Recherches',
    'Téléchargements',
    'Source',
    'Fichier source',
    'Date de création',
  ]

  const rows = metrics.map(m => [
    m.provider.name,
    m.provider.code,
    m.platform,
    m.databaseName ?? '',
    m.title ?? '',
    m.reportType,
    m.metricType,
    m.year,
    m.month,
    m.period,
    m.consultations,
    m.searches ?? '',
    m.downloads ?? '',
    m.source,
    m.sourceFileName ?? '',
    m.createdAt.toISOString(),
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const filename = `icn_usage_export_${new Date().toISOString().slice(0, 10)}.csv`

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return '﻿' + csvContent // BOM pour Excel
})
