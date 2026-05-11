const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../db')

const JWT_SECRET = process.env.JWT_SECRET

// 회원가입 - POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body
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

// 로그인 - POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })

    // 토큰 발급 (1시간 후 만료)
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

module.exports = router
