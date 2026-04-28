import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  key: z.string().min(1),
  value: z.string(),
  category: z.string().default('general'),
  label: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const setting = await prisma.appSetting.upsert({
    where: { key: parsed.data.key },
    create: parsed.data,
    update: { value: parsed.data.value, label: parsed.data.label },
  })

  return setting
})
