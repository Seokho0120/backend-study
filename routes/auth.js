const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')

const JWT_SECRET = 'my-secret-key' // 실제 서비스에선 환경변수로 관리

// 회원가입 - POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' })

    const exists = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (exists) return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' })

    // 비밀번호 해시 (10 = 암호화 강도)
    const hashed = await bcrypt.hash(password, 10)
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashed)

    res.status(201).json({ id: result.lastInsertRowid, email })
  } catch (err) {
    next(err)
  }
})

// 로그인 - POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' })

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })

    // 입력한 비밀번호와 해시된 비밀번호 비교
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
