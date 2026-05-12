import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import authRouter from './routes/auth'
import postsRouter from './routes/posts'
import commentsRouter from './routes/comments'
import uploadRouter from './routes/upload'

const app = express()

app.use(express.json())
app.use(express.static('public'))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/auth', authRouter)
app.use('/posts', postsRouter)
app.use('/posts/:id/comments', commentsRouter)
app.use('/upload', uploadRouter)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message)
  const status = err.status ?? 500
  res.status(status).json({ message: err.message ?? '서버 오류가 발생했습니다.' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
