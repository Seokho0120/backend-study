import { Router, Response, NextFunction } from 'express'
import prisma from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'
import redis from '../lib/redis'

const router = Router()

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: 게시글 목록 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: 키워드
 *     responses:
 *       200:
 *         description: 게시글 목록 및 페이지네이션 정보
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string | undefined
    const skip = (page - 1) * limit

    // 캐시 키: 쿼리 파라미터까지 포함해서 구분
    const cacheKey = `posts:${page}:${limit}:${search ?? ''}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      res.json(JSON.parse(cached))
      return
    }

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

    const result = {
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }

    // 60초 동안 캐시 유지
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60)

    res.json(result)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: 게시글 단건 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 게시글 상세
 *       404:
 *         description: 게시글 없음
 */
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

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: 게시글 작성
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 게시글 작성 성공
 *       401:
 *         description: 인증 필요
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body as { title: string; content: string }
    if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력해주세요.' })

    const post = await prisma.post.create({
      data: { title, content, authorId: req.user!.id }
    })

    // 글이 추가됐으니 목록 캐시 전체 삭제
    const keys = await redis.keys('posts:*')
    if (keys.length > 0) await redis.del(...keys)

    res.status(201).json(post)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /posts/{id}:
 *   patch:
 *     summary: 게시글 수정
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 *       403:
 *         description: 권한 없음
 */
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

    const keys = await redis.keys('posts:*')
    if (keys.length > 0) await redis.del(...keys)

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: 게시글 삭제
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       403:
 *         description: 권한 없음
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string)
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })
    if (post.authorId !== req.user!.id) return res.status(403).json({ message: '권한이 없습니다.' })

    await prisma.post.delete({ where: { id } })

    const keys = await redis.keys('posts:*')
    if (keys.length > 0) await redis.del(...keys)

    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

export default router
