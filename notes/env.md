# 환경변수 (.env)

## 왜 필요한가?

코드에 민감한 값을 직접 쓰면 GitHub에 올라갔을 때 누구나 볼 수 있음.

```
코드에 직접 쓴 경우 (위험)
┌──────────────────────────────────────┐
│  GitHub 레포                         │
│                                      │
│  routes/auth.js                      │
│    const JWT_SECRET = 'my-secret'   │  ← 누구나 볼 수 있음 ❌
│    const DB_PASS = 'password123'    │
│                                      │
└──────────────────────────────────────┘
```

환경변수로 분리하면:

```
코드 (공개 가능)                  .env 파일 (비공개)
┌──────────────────┐             ┌──────────────────┐
│                  │             │                  │
│  process.env     │  ◄──────── │  JWT_SECRET=...  │
│  .JWT_SECRET     │             │  DB_PASSWORD=... │
│                  │             │  PORT=3000       │
└──────────────────┘             └──────────────────┘
  GitHub에 올라감 ✅               .gitignore로 제외 ✅
```

---

## .env 파일

키=값 형태로 환경변수를 정의하는 파일.

```
PORT=3000
JWT_SECRET=my-secret-key
DATABASE_URL=postgresql://유저@localhost:5432/DB이름
```

- `=` 양쪽에 공백 없음
- 따옴표 불필요 (값 그대로 문자열로 읽힘)
- `#`으로 주석 가능

---

## dotenv

`.env` 파일을 읽어서 `process.env`에 넣어주는 라이브러리.
Node.js가 기본 제공하지 않아서 설치 필요.

```bash
npm install dotenv
```

서버 진입점 파일(index.js) 맨 위에 한 줄 추가:

```js
require('dotenv').config()  // 이 한 줄이 .env를 읽어서 process.env에 주입
```

이후 어디서든 `process.env.변수명`으로 접근 가능:

```js
const JWT_SECRET = process.env.JWT_SECRET
const PORT = process.env.PORT || 3000  // 없으면 기본값 3000
```

---

## .gitignore 등록 — 필수

`.env`는 반드시 git 추적에서 제외해야 함.

```
# .gitignore
.env
node_modules
*.db
```

`.env`가 한 번이라도 커밋되면 git 히스토리에 남으므로 주의.
실수로 커밋했다면 토큰/비밀번호를 즉시 재발급해야 함.

---

## DATABASE_URL 구조

```
postgresql://seokori@localhost:5432/backend_study
             ───────  ─────────  ────  ─────────────
             유저명    호스트    포트  DB 이름
```

- `postgresql://` → DB 종류
- `seokori` → DB 접속 유저명 (로컬에선 맥 계정명이 기본값)
- `localhost` → 내 컴퓨터. 배포하면 실제 서버 주소로 변경
- `5432` → PostgreSQL 기본 포트
- `backend_study` → DB 이름

---

## 배포 시 환경변수

`.env` 파일은 배포 서버에 올리지 않음.
대신 Render, Vercel 같은 배포 플랫폼의 **환경변수 설정 UI**에서 직접 입력.

```
로컬 개발                배포 환경
.env 파일         →     플랫폼 환경변수 설정
JWT_SECRET=...          (Render → Environment → Add Variable)
```
