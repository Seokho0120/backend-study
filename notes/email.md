# 이메일 발송

## 동작 원리

서버에서 이메일을 보내는 건 직접 전달하는 게 아니라 **SMTP 서버(우체국)** 를 통해 보냄.

```
내 서버                    SMTP 서버 (우체국)           받는 사람 메일함
┌──────────┐              ┌──────────────────┐        ┌─────────────┐
│          │── 메일 전달 ─>│  Gmail SMTP      │──────> │  받은 편지함 │
│ Express  │              │  SendGrid        │        │             │
│ 서버     │              │  Mailtrap (테스트)│        └─────────────┘
└──────────┘              └──────────────────┘
```

SMTP (Simple Mail Transfer Protocol) = 이메일 전송 표준 프로토콜. HTTP처럼 이메일 전용 통신 규약.

---

## 이메일 서비스 종류

```
개발/테스트용                        실무용
────────────────────────────────    ────────────────────────────────
Mailtrap   → 가짜 받은편지함         SendGrid  → 대량 발송, 무료 100개/일
              실제 발송 안 됨                   → 가장 많이 씀
              개발 중 실수로 발송 없음 Resend    → 최근 인기, 개발자 친화적
                                    Gmail SMTP → 개인 프로젝트에 적합
                                                 하루 500개 제한
```

개발할 때는 Mailtrap으로 테스트, 실서비스 배포 시 SendGrid/Resend로 교체.
→ `.env`의 SMTP 값만 바꾸면 됨. 코드 변경 없음.

---

## nodemailer

Node.js에서 이메일 발송에 가장 많이 쓰이는 라이브러리.

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

---

## 파일 구조

```
src/
  lib/
    mailer.ts      ← nodemailer SMTP 연결 설정
  routes/
    email.ts       ← POST /email/send 엔드포인트

.env
  MAIL_HOST=sandbox.smtp.mailtrap.io
  MAIL_PORT=2525
  MAIL_USER=...
  MAIL_PASS=...
```

---

## mailer.ts — SMTP 연결 설정

```ts
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})
```

`transporter` = nodemailer가 SMTP 서버에 연결하는 객체. 한 번 만들어두고 여러 곳에서 재사용.

---

## 이메일 발송 코드

```ts
await transporter.sendMail({
  from: '"서비스명" <no-reply@example.com>',  // 보내는 사람
  to,                                          // 받는 사람
  subject,                                     // 제목
  text,                                        // 일반 텍스트 버전
  html: `<p>${text}</p>`                       // HTML 버전 (이메일 클라이언트가 지원하면 이걸 보여줌)
})
```

`text`와 `html` 둘 다 보내는 이유:
- 최신 이메일 클라이언트 → HTML 버전 표시
- 구형 클라이언트, 스크린 리더 → text 버전 표시

---

## 요청/응답 흐름

```
POST /email/send
{
  "to": "user@example.com",
  "subject": "제목",
  "text": "내용"
}
        │
        ▼
authMiddleware → 로그인한 사람만 발송 가능
        │
        ▼
transporter.sendMail() → Mailtrap SMTP 서버로 전송
        │
        ▼
{ "message": "이메일이 발송되었습니다." }
```

---

## 실서비스 전환 방법

`.env`의 SMTP 값만 교체하면 됨. 코드 변경 없음.

```
개발 (Mailtrap)                  실서비스 (SendGrid 예시)
────────────────────────────     ────────────────────────────
MAIL_HOST=sandbox.smtp.          MAIL_HOST=smtp.sendgrid.net
          mailtrap.io            MAIL_PORT=587
MAIL_PORT=2525                   MAIL_USER=apikey
MAIL_USER=<mailtrap user>        MAIL_PASS=<SendGrid API Key>
MAIL_PASS=<mailtrap pass>
```

---

## HTML 이메일 — 웹 HTML과 다른 점

이메일 클라이언트(Gmail, Outlook 등)는 CSS를 제대로 지원 안 함.

```
웹 브라우저                        이메일 클라이언트
────────────────────────────────   ────────────────────────────────
flexbox, grid 다 됨                flexbox, grid 지원 안 함
외부 CSS 파일 링크 됨              외부 CSS 파일 무시됨
<style> 태그 됨                    Gmail은 <style> 태그도 무시
                                   → 스타일은 inline으로만 가능
```

그래서 이메일 레이아웃은 **table로 만드는 게 표준**. 옛날 웹 방식으로 돌아가는 것.

```html
<table width="600" style="border-collapse: collapse;">
  <tr>
    <td style="background: #f5f5f5; padding: 20px;">
      <h1 style="color: #333;">안녕하세요</h1>
    </td>
  </tr>
</table>
```

---

## 방법 1 — 간단한 경우 (inline HTML)

`sendMail`의 `html` 필드에 직접 작성. 변수는 템플릿 리터럴로 주입.

```ts
await transporter.sendMail({
  from: '"서비스명" <no-reply@example.com>',
  to,
  subject: `${name}님, 환영합니다!`,
  html: `
    <table width="600" style="...">
      <tr>
        <td style="background: #4F46E5; padding: 30px;">
          <h1 style="color: white;">백엔드 스터디</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px;">
          <h2>안녕하세요, ${name}님!</h2>   <!-- 변수 바로 주입 -->
          <a href="..." style="...">시작하기</a>
        </td>
      </tr>
    </table>
  `
})
```

**언제 쓰나:** 내용이 단순하고, 디자이너 협업 없이 개발자 혼자 관리할 때.

---

## 방법 2 — 복잡한 경우 (템플릿 파일 분리)

HTML 파일을 별도로 만들고, 변수 자리에 `{{변수명}}` 패턴을 써놓은 뒤 코드에서 치환.

**파일 구조:**
```
src/
  templates/
    order-confirm.html   ← {{name}}, {{orderId}} 등 플레이스홀더 포함
    welcome.html
  routes/
    email.ts
```

**템플릿 파일 (`order-confirm.html`) 예시:**
```html
<table width="600" style="...">
  <tr>
    <td>안녕하세요, <strong>{{name}}</strong>님.</td>
  </tr>
  <tr>
    <td>
      <table>
        <tr><td>주문번호</td><td>{{orderId}}</td></tr>
        <tr><td>상품명</td><td>{{productName}}</td></tr>
        <tr><td>결제금액</td><td>{{amount}}원</td></tr>
        <tr><td>주문일시</td><td>{{date}}</td></tr>
      </table>
    </td>
  </tr>
</table>
```

**라우터 코드:**
```ts
import fs from 'fs'
import path from 'path'

const templatePath = path.join(process.cwd(), 'src/templates/order-confirm.html')
const html = fs.readFileSync(templatePath, 'utf-8')
  .replace(/{{name}}/g, name)
  .replace(/{{orderId}}/g, orderId)
  .replace(/{{productName}}/g, productName)
  .replace(/{{amount}}/g, amount)
  .replace(/{{date}}/g, new Date().toLocaleString('ko-KR'))

await transporter.sendMail({ ..., html })
```

`/g` = 파일 안의 `{{name}}`을 전부 치환 (g = global).

**언제 쓰나:** 디자인이 복잡하거나, 디자이너가 HTML을 직접 수정해야 할 때.

---

## 두 방식 비교

```
간단한 경우 (inline)              복잡한 경우 (템플릿 파일)
────────────────────────────────  ────────────────────────────────
html: `<table>...</table>`        fs.readFileSync('template.html')
변수 → ${변수} 템플릿 리터럴       변수 → {{변수}} 패턴 치환
코드 안에 HTML 포함               HTML 파일 별도 관리
간단한 이메일에 적합              디자인 복잡한 이메일에 적합
디자이너 협업 어려움              디자이너가 HTML만 수정 가능
```

---

## 실무에서 더 많이 쓰는 방법 — MJML

이메일 HTML을 직접 짜는 게 너무 힘드니까, 이메일 전용 마크업 언어 MJML을 씀.

```
MJML 코드                          컴파일 결과
────────────────────────────────   ────────────────────────────────
<mjml>                             복잡한 table/inline CSS 자동 생성
  <mj-body>                        → 모든 이메일 클라이언트에서 동작
    <mj-section>
      <mj-column>
        <mj-text>안녕하세요</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

지금 단계에서는 inline HTML 또는 템플릿 파일 방식으로 충분.
나중에 서비스 만들 때 MJML 도입 고려.

---

## Mailtrap 사용법

1. mailtrap.io 회원가입 (무료, 신용카드 불필요)
2. Email Sandbox → Start Testing → My Sandbox
3. SMTP 탭에서 Username, Password 확인 → .env에 입력
4. 이메일 발송 후 My Sandbox Inbox에서 수신 확인
