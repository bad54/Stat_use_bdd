import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  code: z.string().min(1).toUpperCase(),
  type: z.enum(['API_SUSHI', 'FILE_IMPORT', 'MANUAL']),
  apiUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const existing = await prisma.provider.findUnique({ where: { code: parsed.data.code } })
  if (existing) {
    throw createError({ statusCode: 409, message: `Un fournisseur avec le code "${parsed.data.code}" existe déjà.` })
  }

  const provider = await prisma.provider.create({
    data: parsed.data,
  })

  setResponseStatus(event, 201)
  return provider
})
