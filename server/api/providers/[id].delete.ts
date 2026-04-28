import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.provider.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  await prisma.provider.delete({ where: { id } })

  return { success: true, message: 'Fournisseur supprimé.' }
})
