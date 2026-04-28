import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['API_SUSHI', 'FILE_IMPORT', 'MANUAL']).optional(),
  apiUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const existing = await prisma.provider.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable.' })
  }

  const provider = await prisma.provider.update({
    where: { id },
    data: parsed.data,
  })

  return provider
})
