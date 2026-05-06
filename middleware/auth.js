const jwt = require('jsonwebtoken')
const JWT_SECRET = 'my-secret-key'

module.exports = (req, res, next) => {
  const header = req.headers.authorization // "Bearer eyJ..."
  if (!header) return res.status(401).json({ message: '로그인이 필요합니다.' })

  const token = header.split(' ')[1] // "eyJ..." 부분만 추출
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded // { id, email } 을 이후 라우터에서 쓸 수 있게 저장
    next()
  } catch {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' })
  }
}
