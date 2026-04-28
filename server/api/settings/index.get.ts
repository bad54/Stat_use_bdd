import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const settings = await prisma.appSetting.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  })
  return settings
})
