import { PrismaClient, ProviderType, ImportSource, ImportStatus } from '@prisma/client'

const prisma = new PrismaClient()

const PROVIDERS = [
  {
    name: 'Elsevier / Scopus',
    code: 'ELSEVIER',
    type: ProviderType.API_SUSHI,
    apiUrl: 'https://api.elsevier.com/analytics/scival/sushi/r51',
    isActive: true,
    notes: 'Accès via API SUSHI R5.1. Nécessite X-ELS-APIKey et X-ELS-Insttoken.',
  },
  {
    name: 'Sage Journals / Atypon Insights',
    code: 'SAGE',
    type: ProviderType.API_SUSHI,
    apiUrl: 'https://sage.counter5.atypon-insights.com/sushi/r51',
    isActive: true,
    notes: 'API SUSHI R5.1. Customer ID: 1000695009. Rapports: PR, DR, TR, TR_J1.',
  },
  {
    name: 'Statista',
    code: 'STATISTA',
    type: ProviderType.FILE_IMPORT,
    apiUrl: null,
    isActive: true,
    notes: 'Import via fichiers Excel/CSV téléchargés depuis le portail Statista.',
  },
  {
    name: 'Cairn',
    code: 'CAIRN',
    type: ProviderType.FILE_IMPORT,
    apiUrl: null,
    isActive: true,
    notes: 'Import via rapports CSV fournis par Cairn.',
  },
  {
    name: 'EBSCO',
    code: 'EBSCO',
    type: ProviderType.API_SUSHI,
    apiUrl: 'https://cloud.ebsco.com/apps/counter-sushi',
    isActive: true,
    notes: 'API SUSHI COUNTER 5. Contacter EBSCO pour les identifiants.',
  },
  {
    name: 'ProQuest',
    code: 'PROQUEST',
    type: ProviderType.API_SUSHI,
    apiUrl: 'https://sushi.proquest.com/sushi/reports',
    isActive: true,
    notes: 'API SUSHI R5. Plusieurs bases disponibles: ABI/INFORM, Dissertations, etc.',
  },
]

const METRIC_TYPES = [
  'Total_Item_Requests',
  'Unique_Item_Requests',
  'Total_Item_Investigations',
  'Unique_Item_Investigations',
  'No_License',
  'Total_Item_Searches',
]

const REPORT_TYPES = ['PR', 'DR', 'TR', 'TR_J1']

const PLATFORMS_BY_PROVIDER: Record<string, string[]> = {
  ELSEVIER: ['Scopus', 'ScienceDirect', 'Reaxys'],
  SAGE: ['SAGE Journals', 'SAGE Knowledge', 'SAGE Research Methods'],
  STATISTA: ['Statista'],
  CAIRN: ['Cairn.info'],
  EBSCO: ['EBSCOhost', 'Business Source Complete', 'PsycINFO'],
  PROQUEST: ['ProQuest Central', 'ABI/INFORM', 'ProQuest Dissertations'],
}

const DATABASES_BY_PROVIDER: Record<string, string[]> = {
  ELSEVIER: ['Scopus', 'ScienceDirect Freedom Collection'],
  SAGE: ['SAGE Premier', 'SAGE Business'],
  STATISTA: ['Statista Pro'],
  CAIRN: ['Cairn Revues francophones'],
  EBSCO: ['Business Source Complete', 'PsycINFO', 'ERIC'],
  PROQUEST: ['ABI/INFORM Collection', 'ProQuest Central', 'eLibrary'],
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

async function main() {
  console.log('🌱 Début du seed...')

  // Nettoyer les données existantes
  await prisma.usageMetric.deleteMany()
  await prisma.apiSyncLog.deleteMany()
  await prisma.reportImport.deleteMany()
  await prisma.importMapping.deleteMany()
  await prisma.providerCredential.deleteMany()
  await prisma.appSetting.deleteMany()
  await prisma.provider.deleteMany()

  console.log('✓ Données existantes supprimées')

  // Créer les fournisseurs
  const providers = await Promise.all(
    PROVIDERS.map(p => prisma.provider.create({ data: p }))
  )

  console.log(`✓ ${providers.length} fournisseurs créés`)

  // Créer les paramètres de l'application
  await prisma.appSetting.createMany({
    data: [
      { key: 'app.name', value: 'ICN Database Usage Dashboard', category: 'general', label: 'Nom de l\'application' },
      { key: 'app.institution', value: 'ICN Business School', category: 'general', label: 'Institution' },
      { key: 'app.academic_year', value: '2024-2025', category: 'general', label: 'Année académique courante' },
      { key: 'export.default_format', value: 'csv', category: 'export', label: 'Format d\'export par défaut' },
      { key: 'sushi.timeout', value: '30000', category: 'sushi', label: 'Timeout API SUSHI (ms)' },
    ],
  })

  console.log('✓ Paramètres créés')

  // Créer des mappings pour Cairn (import fichier)
  const cairn = providers.find(p => p.code === 'CAIRN')!
  await prisma.importMapping.createMany({
    data: [
      { providerId: cairn.id, reportType: 'DR', sourceColumn: 'Revue', targetField: 'databaseName', isRequired: true },
      { providerId: cairn.id, reportType: 'DR', sourceColumn: 'Plateforme', targetField: 'platform', isRequired: true },
      { providerId: cairn.id, reportType: 'DR', sourceColumn: 'Type de métrique', targetField: 'metricType', isRequired: true },
      { providerId: cairn.id, reportType: 'DR', sourceColumn: 'Période', targetField: 'period', isRequired: true },
      { providerId: cairn.id, reportType: 'DR', sourceColumn: 'Consultations', targetField: 'consultations', isRequired: true },
    ],
  })

  // Créer des mappings pour Statista
  const statista = providers.find(p => p.code === 'STATISTA')!
  await prisma.importMapping.createMany({
    data: [
      { providerId: statista.id, reportType: 'DR', sourceColumn: 'Database', targetField: 'databaseName', isRequired: true },
      { providerId: statista.id, reportType: 'DR', sourceColumn: 'Platform', targetField: 'platform', isRequired: true },
      { providerId: statista.id, reportType: 'DR', sourceColumn: 'Metric_Type', targetField: 'metricType', isRequired: true },
      { providerId: statista.id, reportType: 'DR', sourceColumn: 'Reporting_Period_Total', targetField: 'consultations', isRequired: true },
    ],
  })

  console.log('✓ Mappings créés')

  // Générer des données de démonstration
  const years = [2023, 2024]
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  let totalMetrics = 0

  for (const provider of providers) {
    const platforms = PLATFORMS_BY_PROVIDER[provider.code] || ['Plateforme inconnue']
    const databases = DATABASES_BY_PROVIDER[provider.code] || ['Base inconnue']

    for (const year of years) {
      // Créer un import pour cette année et ce fournisseur
      const reportImport = await prisma.reportImport.create({
        data: {
          providerId: provider.id,
          reportType: 'DR',
          source: provider.type === ProviderType.API_SUSHI ? ImportSource.API : ImportSource.FILE,
          sourceFileName: provider.type === ProviderType.FILE_IMPORT
            ? `${provider.code.toLowerCase()}_${year}_stats.csv`
            : null,
          status: ImportStatus.SUCCESS,
          rowsImported: platforms.length * months.length,
          rowsTotal: platforms.length * months.length,
          createdAt: new Date(`${year}-12-31`),
        },
      })

      // Créer les métriques mensuelles
      const metricsToCreate = []

      for (const platform of platforms) {
        for (const db of databases.slice(0, 2)) {
          for (const month of months) {
            // Simuler une tendance de consultation avec saisonnalité
            const baseConsultations = randomInt(200, 800)
            // Boost en janvier et septembre (rentrées académiques)
            const seasonalFactor = [1, 9].includes(month) ? 1.5 : [7, 8].includes(month) ? 0.6 : 1.0
            // Légère croissance d'une année sur l'autre
            const yearFactor = year === 2024 ? 1.12 : 1.0
            const consultations = Math.floor(baseConsultations * seasonalFactor * yearFactor)

            metricsToCreate.push({
              providerId: provider.id,
              importId: reportImport.id,
              platform,
              databaseName: db,
              reportType: 'DR',
              metricType: 'Total_Item_Requests',
              year,
              month,
              period: generatePeriod(year, month),
              consultations,
              searches: Math.floor(consultations * 0.3),
              downloads: Math.floor(consultations * 0.15),
              source: provider.type === ProviderType.API_SUSHI ? ImportSource.API : ImportSource.FILE,
              sourceFileName: reportImport.sourceFileName,
            })
          }
        }
      }

      await prisma.usageMetric.createMany({ data: metricsToCreate })
      totalMetrics += metricsToCreate.length

      // Créer un log API pour les fournisseurs SUSHI
      if (provider.type === ProviderType.API_SUSHI) {
        await prisma.apiSyncLog.create({
          data: {
            providerId: provider.id,
            reportType: 'DR',
            beginDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            status: ImportStatus.SUCCESS,
            rowsFetched: metricsToCreate.length,
            requestUrl: `${provider.apiUrl}/dr?begin_date=${year}-01&end_date=${year}-12`,
            responseCode: 200,
            duration: randomInt(800, 3000),
            createdAt: new Date(`${year}-12-31`),
          },
        })
      }
    }

    // Mettre à jour la date de dernière synchronisation
    await prisma.provider.update({
      where: { id: provider.id },
      data: { lastSyncAt: new Date('2024-12-31') },
    })
  }

  console.log(`✓ ${totalMetrics} métriques d'utilisation créées`)

  // Ajouter quelques imports partiels et échoués pour l'historique
  const elsevier = providers.find(p => p.code === 'ELSEVIER')!
  await prisma.reportImport.create({
    data: {
      providerId: elsevier.id,
      reportType: 'TR_J1',
      source: ImportSource.API,
      status: ImportStatus.FAILED,
      rowsImported: 0,
      rowsTotal: 0,
      errorMessage: 'Erreur de connexion: timeout après 30s. L\'API Elsevier n\'a pas répondu.',
      createdAt: new Date('2024-11-15'),
    },
  })

  const sage = providers.find(p => p.code === 'SAGE')!
  await prisma.reportImport.create({
    data: {
      providerId: sage.id,
      reportType: 'TR',
      source: ImportSource.FILE,
      sourceFileName: 'sage_tr_2024_partiel.csv',
      status: ImportStatus.PARTIAL,
      rowsImported: 48,
      rowsTotal: 120,
      errorMessage: '72 lignes ignorées: colonnes Metric_Type manquantes ou invalides.',
      createdAt: new Date('2024-10-20'),
    },
  })

  console.log('✓ Imports de démonstration créés')
  console.log('✅ Seed terminé avec succès!')
  console.log(`   → ${providers.length} fournisseurs`)
  console.log(`   → ${totalMetrics} métriques d'utilisation`)
  console.log(`   → Données pour les années ${years.join(', ')}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
