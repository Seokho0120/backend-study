import { Router, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import authMiddleware, { AuthRequest } from '../middleware/auth'
import transporter from '../lib/mailer'

const router = Router()

// 이메일 발송 - POST /email/send
router.post('/send', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { to, subject, text } = req.body as { to: string; subject: string; text: string }
    if (!to || !subject || !text) return res.status(400).json({ message: '수신자, 제목, 내용을 입력해주세요.' })

    await transporter.sendMail({
      from: '"백엔드 스터디" <no-reply@backend-study.com>',
      to,
      subject,
      text,
      html: `<p>${text}</p>`
    })

    res.json({ message: '이메일이 발송되었습니다.' })
  } catch (err) {
    next(err)
  }
})

// 간단한 HTML 이메일 - POST /email/simple
router.post('/simple', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { to, name } = req.body as { to: string; name: string }
    if (!to || !name) return res.status(400).json({ message: '수신자와 이름을 입력해주세요.' })

    await transporter.sendMail({
      from: '"백엔드 스터디" <no-reply@backend-study.com>',
      to,
      subject: `${name}님, 환영합니다!`,
      html: `
        <table width="600" style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td style="background: #4F46E5; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">백엔드 스터디</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background: #ffffff;">
              <h2 style="color: #333;">안녕하세요, ${name}님!</h2>
              <p style="color: #666; line-height: 1.6;">가입을 환영합니다. 지금 바로 시작해보세요.</p>
              <a href="http://localhost:3000"
                 style="display: inline-block; background: #4F46E5; color: white;
                        padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
                시작하기
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; background: #f5f5f5; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2026 백엔드 스터디</p>
            </td>
          </tr>
        </table>
      `
    })

    res.json({ message: '환영 이메일이 발송되었습니다.' })
  } catch (err) {
    next(err)
  }
})

// 템플릿 파일 기반 이메일 - POST /email/order
router.post('/order', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { to, name, orderId, productName, amount } = req.body as {
      to: string; name: string; orderId: string; productName: string; amount: string
    }
    if (!to || !name || !orderId || !productName || !amount)
      return res.status(400).json({ message: '필수 항목을 모두 입력해주세요.' })

    const templatePath = path.join(process.cwd(), 'src/templates/order-confirm.html')
    const html = fs.readFileSync(templatePath, 'utf-8')
      .replace(/{{name}}/g, name)
      .replace(/{{orderId}}/g, orderId)
      .replace(/{{productName}}/g, productName)
      .replace(/{{amount}}/g, amount)
      .replace(/{{date}}/g, new Date().toLocaleString('ko-KR'))

    await transporter.sendMail({
      from: '"백엔드 스터디" <no-reply@backend-study.com>',
      to,
      subject: `[주문확인] ${productName} 주문이 완료되었습니다.`,
      html
    })

    res.json({ message: '주문 확인 이메일이 발송되었습니다.' })
  } catch (err) {
    next(err)
  }
})

export default router
