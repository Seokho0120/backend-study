const express = require('express')
const router = express.Router({ mergeParams: true }) // 부모 라우터의 :id를 사용하기 위해 필요
const db = require('../db')

// 댓글 목록 - GET /posts/:id/comments
router.get('/', (req, res, next) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const comments = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY id ASC').all(req.params.id)
    res.json(comments)
  } catch (err) {
    next(err)
  }
})

// 댓글 작성 - POST /posts/:id/comments
router.post('/', (req, res, next) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })

    const { content } = req.body
    if (!content) return res.status(400).json({ message: '내용을 입력해주세요.' })

    const result = db.prepare('INSERT INTO comments (post_id, content) VALUES (?, ?)').run(req.params.id, content)
    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(newComment)
  } catch (err) {
    next(err)
  }
})

// 댓글 삭제 - DELETE /posts/:id/comments/:commentId
router.delete('/:commentId', (req, res, next) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND post_id = ?').get(req.params.commentId, req.params.id)
    if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' })

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId)
    res.json({ message: '삭제되었습니다.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
