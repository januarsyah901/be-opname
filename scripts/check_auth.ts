import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.users.findMany()
  console.log('Users in DB:', users.length)
  if (users.length > 0) {
    console.log('First user:', users[0].username)
  }

  const tokens = await prisma.refresh_tokens.findMany()
  console.log('Refresh tokens in DB:', tokens.length)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
