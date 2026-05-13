import { Router, Response, NextFunction } from 'express'
import prisma from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router()

// 목록 조회 - GET /posts?page=1&limit=10&search=키워드
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string | undefined
    const skip = (page - 1) * limit

    const where = search
      ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] }
      : {}

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: limit,
        include: { author: { select: { email: true } } }
      }),
      prisma.post.count({ where })
    ])

    res.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    next(err)
  }
})

// 단건 조회 - GET /posts/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: { author: { select: { email: true } } }
    })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })
    res.json(post)
  } catch (err) {
    next(err)
  }
})

// 작성 - POST /posts
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body as { title: string; content: string }
    if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력해주세요.' })

    const post = await prisma.post.create({
      data: { title, content, authorId: req.user!.id }
    })
    res.status(201).json(post)
  } catch (err) {
    next(err)
  }
})

// 수정 - PATCH /posts/:id
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body as { title?: string; content?: string }
    const id = parseInt(req.params.id as string)

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })
    if (post.authorId !== req.user!.id) return res.status(403).json({ message: '권한이 없습니다.' })

    const updated = await prisma.post.update({
      where: { id },
      data: { title: title ?? post.title, content: content ?? post.content }
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// 삭제 - DELETE /posts/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string)
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })
    if (post.authorId !== req.user!.id) return res.status(403).json({ message: '권한이 없습니다.' })

    await prisma.post.delete({ where: { id } })
    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

export default router
