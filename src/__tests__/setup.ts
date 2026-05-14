import { config } from 'dotenv'
import prisma from '../db'
import redis from '../lib/redis'

config({ path: '.env.test' })

beforeEach(async () => {
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
  await redis.quit()
})
