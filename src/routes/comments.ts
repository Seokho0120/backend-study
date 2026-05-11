import { Router, Response, NextFunction } from 'express'
import prisma from '../db'
import { AuthRequest } from '../middleware/auth'

const router = Router({ mergeParams: true })

// 댓글 목록 - GET /posts/:id/comments
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id as string)
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const comments = await prisma.comment.findMany({ where: { postId }, orderBy: { id: 'asc' } })
    res.json(comments)
  } catch (err) {
    next(err)
  }
})

// 댓글 작성 - POST /posts/:id/comments
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id as string)
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const { content } = req.body as { content: string }
    if (!content) return res.status(400).json({ message: '내용을 입력해주세요.' })

    const comment = await prisma.comment.create({ data: { content, postId } })
    res.status(201).json(comment)
  } catch (err) {
    next(err)
  }
})

// 댓글 삭제 - DELETE /posts/:id/comments/:commentId
router.delete('/:commentId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.commentId as string)
    const postId = parseInt(req.params.id as string)

    const comment = await prisma.comment.findFirst({ where: { id, postId } })
    if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' })

    await prisma.comment.delete({ where: { id } })
    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

export default router
