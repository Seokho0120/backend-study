const express = require('express')
const router = express.Router()
const prisma = require('../db')
const authMiddleware = require('../middleware/auth')

// 목록 조회 - GET /posts
router.get('/', async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { id: 'desc' } })
    res.json(posts)
  } catch (err) {
    next(err)
  }
})

// 단건 조회 - GET /posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })
    res.json(post)
  } catch (err) {
    next(err)
  }
})

// 작성 - POST /posts
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, content } = req.body
    if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력해주세요.' })

    const post = await prisma.post.create({
      data: { title, content, authorId: req.user.id }
    })
    res.status(201).json(post)
  } catch (err) {
    next(err)
  }
})

// 수정 - PATCH /posts/:id
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { title, content } = req.body
    const id = parseInt(req.params.id)

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

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
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    await prisma.post.delete({ where: { id } })
    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
