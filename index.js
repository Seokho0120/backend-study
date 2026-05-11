require('dotenv').config()
const express = require('express')
const app = express()

// 요청 본문(body)을 JSON으로 파싱해주는 미들웨어
app.use(express.json())
// public 폴더의 파일을 그대로 서빙 (HTML, CSS, JS)
app.use(express.static('public'))

// 라우터 연결 (나중에 추가할 거야)
const authRouter = require('./routes/auth')
const postsRouter = require('./routes/posts')
const commentsRouter = require('./routes/comments')
app.use('/auth', authRouter)
app.use('/posts', postsRouter)
app.use('/posts/:id/comments', commentsRouter)

// 전역 에러 핸들러 - 인자가 4개(err 포함)여야 Express가 에러 핸들러로 인식함
app.use((err, req, res, next) => {
  console.error(err.message)
  const status = err.status ?? 500
  res.status(status).json({ message: err.message ?? '서버 오류가 발생했습니다.' })
})

// 서버 시작
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
