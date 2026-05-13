import { Router, Response, NextFunction } from 'express'
import prisma from '../db'
import authMiddleware, { AuthRequest } from '../middleware/auth'

const router = Router({ mergeParams: true })

/**
 * @swagger
 * /posts/{id}/comments:
 *   get:
 *     summary: 댓글 목록 조회
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 댓글 목록
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id as string)
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { id: 'asc' },
      include: { author: { select: { email: true } } }
    })
    res.json(comments)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     summary: 댓글 작성
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 *       401:
 *         description: 인증 필요
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id as string)
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const { content } = req.body as { content: string }
    if (!content) return res.status(400).json({ message: '내용을 입력해주세요.' })

    const comment = await prisma.comment.create({ data: { content, postId, authorId: req.user!.id } })
    res.status(201).json(comment)
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /posts/{id}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       403:
 *         description: 권한 없음
 */
router.delete('/:commentId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.commentId as string)
    const postId = parseInt(req.params.id as string)

    const comment = await prisma.comment.findFirst({ where: { id, postId } })
    if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' })
    if (comment.authorId !== req.user!.id) return res.status(403).json({ message: '권한이 없습니다.' })

    await prisma.comment.delete({ where: { id } })
    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

export default router
