import { prisma } from '~/server/utils/prisma'
import { parseCSV, parseTSV, parseXLSX, detectDelimiter } from '~/server/utils/parsers'
import { guessMapping } from '~/server/utils/mapping'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'Aucun fichier reçu.' })
  }

  const fileField = formData.find(f => f.name === 'file')
  const providerIdField = formData.find(f => f.name === 'providerId')

  if (!fileField?.data) {
    throw createError({ statusCode: 400, message: 'Champ "file" manquant.' })
  }
  if (!providerIdField?.data) {
    throw createError({ statusCode: 400, message: 'Champ "providerId" manquant.' })
  }

  const providerId = providerIdField.data.toString('utf-8')
  const filename = fileField.filename ?? 'upload.csv'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'csv'

  const provider = await prisma.provider.findUnique({ where: { id: providerId } })
  if (!provider) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  let parsed
  if (ext === 'xlsx' || ext === 'xls') {
    parsed = parseXLSX(fileField.data)
  } else if (ext === 'tsv') {
    parsed = parseTSV(fileField.data.toString('utf-8'))
  } else {
    const content = fileField.data.toString('utf-8')
    const delimiter = detectDelimiter(content)
    parsed = parseCSV(content, delimiter)
  }

  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    throw createError({ statusCode: 422, message: `Fichier invalide: ${parsed.errors[0]}` })
  }

  // Tenter de deviner le mapping automatiquement
  const suggestedMapping = guessMapping(parsed.headers)

  // Récupérer les mappings enregistrés pour ce fournisseur
  const savedMappings = await prisma.importMapping.findMany({
    where: { providerId },
  })

  return {
    filename,
    headers: parsed.headers,
    preview: parsed.rows.slice(0, 10),
    totalRows: parsed.totalRows,
    parseErrors: parsed.errors,
    suggestedMapping,
    savedMappings,
    provider: { id: provider.id, name: provider.name },
  }
})
