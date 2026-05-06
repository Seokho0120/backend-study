const express = require('express')
const router = express.Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')

// 목록 조회 - GET /posts
router.get('/', (req, res, next) => {
  try {
    const posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all()
    res.json(posts)
  } catch (err) {
    next(err)
  }
})

// 단건 조회 - GET /posts/:id
router.get('/:id', (req, res, next) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })
    res.json(post)
  } catch (err) {
    next(err)
  }
})

// 작성 - POST /posts
router.post('/', authMiddleware, (req, res, next) => {
  try {
    const { title, content } = req.body
    if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력해주세요.' })

    const result = db.prepare('INSERT INTO posts (title, content) VALUES (?, ?)').run(title, content)
    const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(newPost)
  } catch (err) {
    next(err)
  }
})

// 수정 - PATCH /posts/:id
router.patch('/:id', authMiddleware, (req, res, next) => {
  try {
    const { title, content } = req.body
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    db.prepare('UPDATE posts SET title = ?, content = ? WHERE id = ?').run(
      title ?? post.title,
      content ?? post.content,
      req.params.id
    )
    const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// 삭제 - DELETE /posts/:id
router.delete('/:id', authMiddleware, (req, res, next) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id)
    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
