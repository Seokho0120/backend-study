const express = require('express')
const router = express.Router({ mergeParams: true })
const prisma = require('../db')

// 댓글 목록 - GET /posts/:id/comments
router.get('/', async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id)
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { id: 'asc' }
    })
    res.json(comments)
  } catch (err) {
    next(err)
  }
})

// 댓글 작성 - POST /posts/:id/comments
router.post('/', async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id)
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const { content } = req.body
    if (!content) return res.status(400).json({ message: '내용을 입력해주세요.' })

    const comment = await prisma.comment.create({
      data: { content, postId }
    })
    res.status(201).json(comment)
  } catch (err) {
    next(err)
  }
})

// 댓글 삭제 - DELETE /posts/:id/comments/:commentId
router.delete('/:commentId', async (req, res, next) => {
  try {
    const id = parseInt(req.params.commentId)
    const postId = parseInt(req.params.id)

    const comment = await prisma.comment.findFirst({ where: { id, postId } })
    if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' })

    await prisma.comment.delete({ where: { id } })
    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
