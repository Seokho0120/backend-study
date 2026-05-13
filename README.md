# Backend Study

프론트엔드 개발자가 백엔드 기초를 공부하기 위해 만든 프로젝트.
Node.js + Express + SQLite로 게시글/댓글 CRUD API + JWT 인증 구현.

---

## 기술 스택

- **Node.js** — 서버에서 JS 실행하는 환경
- **Express** — Node.js 기반 웹 서버 프레임워크
- **better-sqlite3** — SQLite DB 라이브러리 (파일 기반 DB)
- **bcrypt** — 비밀번호 해시
- **jsonwebtoken** — JWT 토큰 생성/검증

---

## 프로젝트 구조

```
backend-study/
  index.js              ← 서버 시작점, 미들웨어/라우터 등록
  db.js                 ← DB 연결 + 테이블 생성
  middleware/
    auth.js             ← JWT 인증 미들웨어
  routes/
    auth.js             ← 회원가입/로그인
    posts.js            ← 게시글 CRUD
    comments.js         ← 댓글 CRUD
  public/
    index.html          ← 프론트 테스트용 HTML
  posts.db              ← SQLite DB 파일 (gitignore됨)
```

---

## 실행 방법

```bash
npm install
node index.js
# http://localhost:3000
```

---

## 핵심 개념

### 서버란?
항상 켜져 있는 프로그램. 요청이 오면 처리하고 응답함.
브라우저(클라이언트)가 요청을 보내면 서버가 데이터를 응답하는 구조.

```
브라우저 → 요청 → 서버 → DB 조회 → 응답 → 브라우저
```

### DB란?
서버는 재시작하면 메모리가 날아감. DB는 데이터를 영구적으로 저장하는 곳.
SQLite는 `.db` 파일 하나가 DB 전체. 설치 없이 파일만으로 동작.

### REST API 설계 원칙
URL은 명사, 행위는 HTTP 메서드로 표현.

```
GET    /posts          → 목록 조회
GET    /posts/:id      → 단건 조회
POST   /posts          → 생성
PATCH  /posts/:id      → 수정
DELETE /posts/:id      → 삭제
```

### 미들웨어란?
요청이 라우터에 도달하기 전에 실행되는 함수.
`app.use(함수)` 형태로 등록하며, 순서가 중요함.

```js
// 예시: 모든 요청에 실행
app.use(express.json())       // body를 JSON으로 파싱
app.use(express.static('public'))  // 정적 파일 서빙

// 특정 라우트에만 실행
router.post('/', authMiddleware, (req, res) => { ... })
//            ↑ 이 라우트에만 인증 미들웨어 실행
```

### req / res
```
req (request)  → 클라이언트가 보낸 것
  req.body        → POST/PATCH 요청의 body
  req.params.id   → URL의 :id 값 (/posts/5 → "5")
  req.headers     → Authorization 등 헤더

res (response) → 서버가 돌려줄 것
  res.json(data)         → JSON 응답
  res.status(404).json() → 상태코드 + JSON 응답
```

### 에러 처리
각 라우터에서 `try-catch`로 에러를 잡아 `next(err)`로 전달.
`index.js` 맨 아래에 전역 에러 핸들러 등록 (인자 4개여야 인식됨).

```js
// 라우터
try {
  ...
} catch (err) {
  next(err)  // 전역 핸들러로 넘김
}

// index.js 맨 아래
app.use((err, req, res, next) => {
  res.status(err.status ?? 500).json({ message: err.message })
})
```

### 테이블 관계 (Foreign Key)
댓글은 특정 게시글에 속함. `post_id`로 연결.

```
posts 테이블           comments 테이블
id | title            id | post_id | content
1  | 첫 글     ←───  1  |    1    | 좋아요
2  | 두번째    ←───  2  |    1    | 감사해요
                      3  |    2    | 잘봤어요
```

```sql
FOREIGN KEY (post_id) REFERENCES posts(id)
```

### JWT 인증 흐름

```
[회원가입]
POST /auth/register → 비밀번호 bcrypt 해시 → DB 저장

[로그인]
POST /auth/login → bcrypt.compare(입력비번, 해시) → 일치하면 JWT 토큰 발급 → 프론트에 전달

[이후 요청]
헤더에 토큰 첨부 → 서버가 jwt.verify()로 검증 → 통과하면 req.user에 유저 정보 저장
```

**토큰 구조:**
```
eyJhbGci...  .  eyJpZCI6MSwiZW1...  .  서명
   헤더             페이로드(데이터)      서명
```
페이로드는 누구나 열어볼 수 있음. 서명이 위조 방지 역할.

**JWT_SECRET:**
- 서버 시작 시 1회 세팅
- 토큰 서명/검증에 사용
- 반드시 환경변수로 관리 (코드에 직접 쓰면 안 됨)
- 유출되면 누구든 토큰 위조 가능

```js
// 토큰 발급 (로그인 시)
const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '1h' })

// 토큰 검증 (요청마다)
const decoded = jwt.verify(token, JWT_SECRET)
req.user = decoded  // { id, email }
```

---

## API 목록

### 인증
| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /auth/register | 회원가입 | 불필요 |
| POST | /auth/login | 로그인 → 토큰 발급 | 불필요 |

### 게시글
| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /posts | 목록 조회 | 불필요 |
| GET | /posts/:id | 단건 조회 | 불필요 |
| POST | /posts | 작성 | 필요 |
| PATCH | /posts/:id | 수정 | 필요 |
| DELETE | /posts/:id | 삭제 | 필요 |

### 댓글
| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /posts/:id/comments | 댓글 목록 | 불필요 |
| POST | /posts/:id/comments | 댓글 작성 | 불필요 |
| DELETE | /posts/:id/comments/:commentId | 댓글 삭제 | 불필요 |

---

## 테스트 (curl)

```bash
# 회원가입
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "1234"}'

# 로그인
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "1234"}'

# 게시글 작성 (토큰 필요)
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <토큰>" \
  -d '{"title": "제목", "content": "내용"}'

# 게시글 목록
curl http://localhost:3000/posts

# 댓글 작성
curl -X POST http://localhost:3000/posts/1/comments \
  -H "Content-Type: application/json" \
  -d '{"content": "댓글 내용"}'
```

---

## DB 테이블 구조

```sql
-- 유저
CREATE TABLE users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,       -- bcrypt 해시
  created_at TEXT    DEFAULT (datetime('now', 'localtime'))
)

-- 게시글
CREATE TABLE posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now', 'localtime'))
)

-- 댓글
CREATE TABLE comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL,        -- posts.id 참조 (foreign key)
  content    TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (post_id) REFERENCES posts(id)
)
```

---

## 다음 공부할 것

- [ ] PostgreSQL로 DB 전환 (실제 서비스 수준)
- [ ] 환경변수 (.env) 적용
- [ ] 배포 (Render 무료 플랜)
- [ ] TypeScript + ES Module로 전환

