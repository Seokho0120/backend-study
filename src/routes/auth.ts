import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET as string

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       409:
 *         description: 이미 사용 중인 이메일
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' })

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, password: hashed } })

    res.status(201).json({ id: user.id, email })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: 이메일 또는 비밀번호 불일치
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

export default router
