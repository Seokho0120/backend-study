import { Router, Response, NextFunction } from 'express'
import authMiddleware, { AuthRequest } from '../middleware/auth'
import upload from '../lib/upload'

const router = Router()

// 파일 업로드 - POST /upload
router.post('/', authMiddleware, upload.single('file'), (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ message: '파일을 선택해주세요.' })

    res.status(201).json({
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    })
  } catch (err) {
    next(err)
  }
})

export default router
