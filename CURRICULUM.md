# 백엔드 공부 커리큘럼

프론트엔드 개발자가 직접 서비스를 만들기 위한 백엔드 전체 학습 로드맵.

---

## 커리큘럼 1 — 백엔드 기초 ✅ 완료 (2026-05-06)

**목표:** 백엔드가 어떻게 동작하는지 전체 흐름 이해

### 배운 것
- **서버/DB 개념** — 서버란 무엇인지, DB가 왜 필요한지, 둘이 어떻게 연결되는지
- **Node.js** — JS를 서버에서 실행하는 환경
- **Express** — 서버 프레임워크, 라우팅, req/res, 미들웨어
- **SQLite** — 파일 기반 DB, 테이블 설계, SQL 기초 (SELECT/INSERT/UPDATE/DELETE)
- **REST API** — URL 설계 원칙, HTTP 메서드, 상태코드
- **에러 처리** — try-catch, next(err), 전역 에러 핸들러
- **테이블 관계** — Foreign Key, 게시글-댓글 1:N 관계
- **JWT 인증** — 회원가입, 비밀번호 해시(bcrypt), 로그인, 토큰 발급/검증
- **인증 미들웨어** — 보호된 라우트, Authorization 헤더
- **프론트-백엔드 연결** — fetch, Authorization 헤더 처리

### 만든 것
- 게시글 CRUD API (`/posts`)
- 댓글 CRUD API (`/posts/:id/comments`)
- 회원가입/로그인 API (`/auth`)
- 프론트 테스트 HTML

---

## 커리큘럼 2 — 실전 전환

**목표:** 실제 서비스에서 쓰는 구조로 전환

### 학습 항목

#### 1. 환경변수 (.env)
- JWT_SECRET, DB 연결정보 등 민감한 값을 코드에서 분리
- `dotenv` 라이브러리 사용
- `.gitignore`에 `.env` 추가하는 이유

#### 2. PostgreSQL로 DB 전환
- SQLite vs PostgreSQL 차이 (파일 vs 서버형 DB)
- 왜 실제 서비스에선 PostgreSQL을 쓰는지
- 로컬에 PostgreSQL 설치 및 연결

#### 3. Prisma (ORM) 도입
- ORM이 뭔지 — SQL 직접 안 쓰고 JS로 DB 조작
- Prisma 스키마 정의
- 마이그레이션 개념 (DB 구조 변경 이력 관리)
- 기존 SQL 쿼리를 Prisma로 전환

```js
// 기존 SQL 방식
db.prepare('SELECT * FROM posts WHERE id = ?').get(id)

// Prisma 방식
prisma.post.findUnique({ where: { id } })
```

#### 4. TypeScript + ES Module 전환
- `require/module.exports` → `import/export`
- TypeScript로 타입 안정성 확보
- req.body 타입 정의

#### 5. 배포 (Render)
- 환경변수 설정
- GitHub 연동 자동 배포
- 무료 플랜으로 Express 서버 배포

---

## 커리큘럼 3 — 기능 확장

**목표:** 실제 서비스에 필요한 기능들 구현

### 학습 항목

#### 1. 페이지네이션
- 게시글 10개씩 나눠서 가져오기
- `page`, `limit` 쿼리 파라미터
- `req.query` 사용법

```
GET /posts?page=1&limit=10
```

#### 2. 검색
- 제목/내용으로 게시글 검색
- SQL `LIKE` 또는 Prisma `contains`

```
GET /posts?search=키워드
```

#### 3. 파일 업로드
- 이미지 업로드 (`multer` 라이브러리)
- 파일을 서버에 저장하는 방법
- 클라우드 스토리지 연동 (AWS S3 또는 Cloudinary)

#### 4. 이메일 발송
- 회원가입 인증 메일
- `nodemailer` 또는 외부 서비스 (SendGrid, Resend)

#### 5. 권한 처리
- 자기 글만 수정/삭제 가능하게
- `post.user_id === req.user.id` 검증
- posts 테이블에 user_id 컬럼 추가

---

## 커리큘럼 4 — 심화

**목표:** 서비스 품질 높이기

### 학습 항목

#### 1. 실시간 통신 (WebSocket)
- HTTP vs WebSocket 차이
- `socket.io`로 실시간 채팅 구현
- 실시간 알림

#### 2. 테스트 코드
- 왜 테스트를 작성하는지
- `jest`로 API 테스트
- 테스트 DB 분리

#### 3. API 문서화
- Swagger로 API 명세 자동 생성
- 협업 시 프론트-백엔드 소통 방법

#### 4. 캐싱
- 자주 요청되는 데이터를 미리 저장
- Redis 기초

#### 5. 로깅
- 서버 요청/에러 기록
- `winston` 또는 `morgan`

---

## 커리큘럼 5 — 인프라

**목표:** 서비스 운영 및 스케일링

> 개인 서비스 수준에서는 당장 필요하지 않음. 사용자가 많아지거나 팀 개발 시 필요.

### 학습 항목

#### 1. Docker
- 개발 환경을 컨테이너로 묶기
- `docker-compose`로 서버 + DB 한 번에 실행

#### 2. CI/CD (GitHub Actions)
- 코드 push 시 자동 테스트 + 배포
- 배포 자동화

#### 3. 클라우드 (AWS/GCP)
- EC2로 서버 직접 운영
- RDS로 DB 운영
- S3로 파일 저장

---

## 학습 우선순위 요약

```
지금 당장 서비스 만들려면
  커리큘럼 1 ✅ → 커리큘럼 2 → 커리큘럼 3

기능 풍부한 서비스 만들려면
  + 커리큘럼 4

대규모 서비스 운영하려면
  + 커리큘럼 5
```

---

## 현재 진행 상황

- [x] 커리큘럼 1 완료 (2026-05-06)
- [ ] 커리큘럼 2 진행 예정
- [ ] 커리큘럼 3
- [ ] 커리큘럼 4
- [ ] 커리큘럼 5
