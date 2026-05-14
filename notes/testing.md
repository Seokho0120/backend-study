# 테스트 코드 (Jest + Supertest)

## 테스트가 왜 필요한가

코드를 수정했을 때 기존 기능이 망가졌는지 자동으로 확인하기 위해.

```
수동 테스트: 서버 켜기 → Thunder Client로 요청 → 눈으로 확인 (매번 반복)
자동 테스트: npm test 한 번 → 전체 API 자동 검사
```

실무에서는 리소스 부담으로 잘 안 쓰이기도 하지만,
코드 규모가 커질수록 사이드 이펙트 방지에 효과적.

---

## 테스트 종류

| 종류 | 설명 | 예시 |
|------|------|------|
| 단위 테스트 | 함수 하나만 테스트 | 이메일 검증 함수 |
| 통합 테스트 | 여러 부품 연결 상태로 테스트 | POST /auth/login → 토큰 반환 확인 |
| E2E 테스트 | 실제 브라우저로 처음~끝 | Playwright, Cypress |

→ 백엔드에서는 **통합 테스트**가 제일 실용적

---

## 설치한 패키지

```bash
npm install -D jest supertest ts-jest @types/jest @types/supertest dotenv-cli
```

| 패키지 | 역할 |
|--------|------|
| `jest` | 테스트 실행, 통과/실패 판정 |
| `ts-jest` | TypeScript를 jest가 읽을 수 있게 변환 |
| `supertest` | 서버 없이 Express 앱에 HTTP 요청 |
| `dotenv-cli` | npm test 시 .env.test 파일 로드 |

---

## 파일 구조

```
src/
  app.ts              Express 앱 설정 (미들웨어, 라우터)
  index.ts            app.ts 불러와서 서버 실행만
  __tests__/
    setup.ts          테스트 전 준비 (DB 초기화)
    auth.test.ts      인증 API 테스트
    posts.test.ts     게시글 API 테스트
jest.config.ts        jest 설정
```

### app.ts / index.ts 분리 이유

테스트할 때는 실제 서버를 켜면 안 됨.
supertest가 `app` 객체를 직접 찌르기 때문에 `app.listen`이 필요 없음.

```
실제 실행:  index.ts → app.ts import + app.listen(3000)
테스트:     app.ts만 import → supertest가 직접 요청
```

---

## jest.config.ts

```typescript
const config = {
  preset: 'ts-jest',                                         // TS 프로젝트
  testEnvironment: 'node',                                   // Node.js 환경
  testMatch: ['**/__tests__/**/*.test.ts'],                  // 테스트 파일 패턴
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],  // 테스트 전 실행할 파일
}
```

---

## setup.ts

```typescript
config({ path: '.env.test' })  // 테스트 DB 환경변수 로드

beforeEach(async () => {
  // 각 테스트 실행 전마다 DB 초기화
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()  // 모든 테스트 후 DB 연결 끊기
})
```

`beforeEach`: 테스트마다 깨끗한 DB 상태 보장 → 테스트끼리 데이터 간섭 없음
`afterAll`: 전체 테스트 완료 후 한 번 실행

---

## 테스트 파일 구조

```typescript
describe('POST /auth/register', () => {   // 테스트 그룹
  it('성공 케이스 설명', async () => {      // 테스트 케이스 하나
    const res = await request(app)         // supertest로 요청
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '1234' })

    expect(res.status).toBe(201)                          // 상태코드 검증
    expect(res.body).toHaveProperty('id')                 // body에 id가 있는지
    expect(res.body).toHaveProperty('email', 'test@test.com')  // 값까지 검증
  })
})
```

### describe vs it

- `describe`: 테스트 묶음. "어떤 API에 대한 테스트인지" 그룹화
- `it`: 테스트 케이스 하나. "이런 상황에서 이렇게 돼야 한다"

### 자주 쓰는 expect 메서드

```typescript
expect(value).toBe(201)                      // 정확히 일치
expect(value).toHaveProperty('key')          // 해당 키가 있는지
expect(value).toHaveProperty('key', 'value') // 키와 값 모두 확인
expect(value).toBeDefined()                  // undefined가 아닌지
expect(value).toBeNull()                     // null인지
expect(array).toHaveLength(3)               // 배열 길이
```

---

## package.json 스크립트

```json
"test": "NODE_ENV=test dotenv -e .env.test -- jest --runInBand"
```

- `NODE_ENV=test`: 환경을 test로 설정
- `dotenv -e .env.test`: 테스트 DB 환경변수 로드
- `--runInBand`: 테스트를 순서대로 실행 (병렬 실행 시 DB 충돌 방지)

---

## 테스트 DB 분리

테스트는 DB를 마음대로 건드림. 실제 DB 사용 시 데이터 오염 위험.

```
.env           DATABASE_URL=.../backend_study       실제 DB
.env.test      DATABASE_URL=.../backend_study_test  테스트 전용 DB
```

테스트 DB 생성 및 마이그레이션:
```bash
createdb backend_study_test
DATABASE_URL=postgresql://seokori@localhost:5432/backend_study_test npx prisma migrate deploy
```

---

## 인증이 필요한 API 테스트 패턴

로그인 후 토큰을 받아서 요청하는 패턴 — 실무에서 가장 많이 씀.

```typescript
// 반복 코드를 헬퍼 함수로 분리
async function registerAndLogin(email: string, password: string): Promise<string> {
  await request(app).post('/auth/register').send({ email, password })
  const res = await request(app).post('/auth/login').send({ email, password })
  return res.body.token
}

// 토큰을 Authorization 헤더에 담아서 요청
const token = await registerAndLogin('user@test.com', '1234')

const res = await request(app)
  .post('/posts')
  .set('Authorization', `Bearer ${token}`)  // 헤더 추가
  .send({ title: '제목', content: '내용' })
```

### 403 테스트 — 두 유저가 필요한 이유

```typescript
const authorToken = await registerAndLogin('author@test.com', '1234')
const otherToken  = await registerAndLogin('other@test.com', '1234')

// author가 글 씀
const createRes = await request(app)
  .post('/posts')
  .set('Authorization', `Bearer ${authorToken}`)
  .send({ title: '원래 제목', content: '내용' })

// other가 수정 시도 → 403 나와야 함
const res = await request(app)
  .patch(`/posts/${createRes.body.id}`)
  .set('Authorization', `Bearer ${otherToken}`)
  .send({ title: '수정 시도' })

expect(res.status).toBe(403)
```

---

## 테스트 실행 방법

```bash
npm test                            # 전체 테스트 실행
npm test posts                      # posts 파일만 실행
npm test -- --watch                 # 파일 저장 시 자동 재실행
```

결과 읽는 법:
```
PASS src/__tests__/auth.test.ts      ← 이 파일 전체 통과
PASS src/__tests__/posts.test.ts

Test Suites: 2 passed, 2 total       ← 파일 2개 통과
Tests:       10 passed, 10 total     ← 케이스 10개 통과
```

중간에 찍히는 `GET /posts 200 49ms` 같은 줄은 morgan 로그 — 테스트 요청도 기록되는 것, 정상.

---

## 전체 실행 흐름

```
npm test
  → .env.test 로드 (테스트 DB 연결)
  → setup.ts의 beforeEach 등록
  → *.test.ts 파일 순서대로 실행
    → 각 테스트 전: beforeEach (DB 초기화)
    → 테스트 실행: supertest로 요청 → expect로 검증
  → 모든 테스트 후: afterAll (DB 연결 끊기)
  → 결과 출력
```
