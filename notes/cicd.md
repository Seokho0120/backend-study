# CI/CD (GitHub Actions)

## CI/CD가 뭔지

**비유:** 자동 품질검사 컨베이어 벨트

```
예전 방식
  코드 작성 → 수동으로 테스트 → 수동으로 배포
  (사람이 매번 직접 해야 함, 까먹으면 끝)

CI/CD
  코드 push → 자동으로 테스트 → 자동으로 배포
  (한 번 설정해두면 영원히 자동으로 돌아감)
```

- **CI (Continuous Integration)** = push할 때마다 자동 테스트/빌드
- **CD (Continuous Deployment)** = CI 통과하면 자동 배포

---

## GitHub Actions가 뭔지

GitHub에서 제공하는 자동화 도구.
별도 서버 없이 GitHub이 Ubuntu 서버를 띄워서 실행해줌. 공개 레포는 무료.

설정 파일 위치:
```
.github/
  workflows/
    ci.yml    ← 이 파일 하나로 전부 설정
```

---

## 실행 흐름

```
git push
   │
   ▼
GitHub이 감지 → Ubuntu 서버 자동 시작
   │
   ├─ PostgreSQL 컨테이너 실행 (테스트용 DB)
   ├─ Redis 컨테이너 실행 (테스트용 캐시)
   │
   ├─ 코드 받아오기 (checkout)
   ├─ Node.js 20 설치
   ├─ npm ci
   ├─ prisma generate
   ├─ .env.test 생성
   ├─ prisma migrate deploy
   ├─ npm test ──▶ __tests__/*.ts 실행
   └─ npm run build
         │
   ✅ 전부 통과 → 초록불
   ❌ 하나라도 실패 → 빨간불 + 이메일 알림
```

---

## ci.yml 구조

```yaml
name: CI

# 언제 실행할지
on:
  push:
    branches: [main]      # main에 push할 때마다 실행
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest  # GitHub이 제공하는 Ubuntu 서버

    # 테스트에 필요한 서비스 자동 실행
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: backend_study_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4       # 코드 받아오기
      - uses: actions/setup-node@v4     # Node.js 설치
        with:
          node-version: '20'
          cache: 'npm'                  # node_modules 캐싱

      - run: npm ci
      - run: npx prisma generate

      - name: 테스트 환경변수 설정
        run: |
          echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backend_study_test" > .env.test
          echo "JWT_SECRET=test-secret" >> .env.test
          echo "NODE_ENV=test" >> .env.test
          echo "REDIS_URL=redis://localhost:6379" >> .env.test

      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/backend_study_test

      - run: npm test
      - run: npm run build
```

---

## yml 문법 핵심

```yaml
- uses: actions/checkout@v4   # 남이 만든 액션 가져다 쓰기
                               # npm 패키지처럼 공개된 걸 재사용

- run: npm ci                  # 그냥 터미널 명령어 그대로
```

`actions/checkout@v4` 읽는 법:
```
actions  /  checkout  @  v4
  │            │          │
만든 조직    액션 이름   버전
(GitHub)
```

GitHub Marketplace에 수천 개의 액션이 있음.

---

## Actions 탭에서 보이는 단계 구분

```
Set up job          ┐
Init containers     ├── GitHub이 자동으로 붙여주는 준비/정리 단계
──────────────────  │   (우리가 yml에 안 적어도 자동으로 생김)
코드 체크아웃       ┤
Node.js 설정        ├── ci.yml의 steps에 우리가 직접 정의한 것
테스트 실행         ┤   (테스트 실행 단계에서 __tests__/*.ts 가 돌아감)
빌드 확인           │
──────────────────  │
Post 코드 체크아웃  ┤
Stop containers     ├── GitHub이 자동으로 붙여주는 뒷정리 단계
Complete job        ┘
```

---

## CI가 있으면 뭐가 좋냐

```
CI 없을 때                    CI 있을 때
────────────────────────────────────────────────
"push했는데 테스트 돌렸어?"    push하면 자동으로 돌아감
"아 까먹었어요..."             까먹을 수가 없음
여러 명이 코드 합칠 때 충돌    자동으로 감지
"내 컴퓨터에선 됐는데..."      GitHub 서버에서도 검증됨
```

---

## yml 직접 작성 안 해도 됨

복잡하고 어렵게 느껴지는 게 정상. 실제 현업에서도 대부분 **복붙해서 씀**.

**실제 워크플로우:**
1. 구글에 "GitHub Actions Node.js CI" 검색
2. GitHub 공식 템플릿 or 남의 레포 yml 복붙
3. 프로젝트에 맞게 조금만 수정

**GitHub 템플릿 사용법:**
레포 → Actions 탭 → New workflow → Node.js, Docker 등 템플릿 선택

**알아야 할 핵심 구조 6가지:**
```yaml
on:       # 언제 실행? (push, PR 등)
jobs:     # 뭘 실행?
  runs-on # 어떤 서버?
  steps:  # 순서대로 뭘 해?
    uses  # 남이 만든 액션 가져다 쓰기
    run   # 터미널 명령어
```

이 6가지 구조만 이해하면 나머지는 검색해서 붙여넣기. 문법 전체를 외울 필요 없음.

---

## CI vs 테스트 코드 역할 구분

```
ci.yml                          __tests__/*.ts
──────────────────────          ──────────────────────────────
"언제, 어떤 환경에서             "실제로 뭘 검사할지"
 테스트를 실행할지"

push하면 자동으로 실행           GET /posts 가 200 반환하는지
Ubuntu 서버 준비                 로그인 없이 글 쓰면 401인지
PostgreSQL, Redis 띄우기         권한 없는 유저가 수정하면 403인지
npm test 실행          ──▶      이 코드들이 실제로 돌아감
```
