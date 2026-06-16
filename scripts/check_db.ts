import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Restoring all work_orders ---')
  const restoreCount = await prisma.work_orders.updateMany({
    where: { NOT: { deleted_at: null } },
    data: { deleted_at: null }
  })
  console.log(`Restored records: ${restoreCount.count}`)
  
  const count = await prisma.work_orders.count({
    where: { deleted_at: null }
  })
  console.log(`Total non-deleted records: ${count}`)
  
  const totalCount = await prisma.work_orders.count()
  console.log(`Total records (including deleted): ${totalCount}`)
  
  if (totalCount > 0) {
    const records = await prisma.work_orders.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    })
    console.log('Last 5 records:', JSON.stringify(records, null, 2))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
