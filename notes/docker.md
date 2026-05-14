# Docker

## Docker가 뭔지

코드를 다른 환경에서 실행하면 생기는 문제:
- "Node.js 버전이 달라서 안 돼요"
- "DB가 설치 안 되어 있어요"
- "맥에선 되는데 서버에선 왜 안 되죠?"

Docker는 **"코드 + 실행 환경 + 패키지를 하나의 상자(컨테이너)에 담는 것"**.
이 상자만 있으면 어디서든 똑같이 실행됨.

---

## 핵심 개념 4가지 — 분식집 비유

### Dockerfile = 붕어빵틀 만드는 설명서

```
"재료 준비 → 틀 모양 잡기 → 손잡이 달기" 순서 적힌 종이
```

순서대로 실행해서 Image를 만드는 설명서.

### Image = 붕어빵틀

Dockerfile 대로 만들어진 완성된 틀. 아직 실행 안 된 상태.

```bash
docker build -t my-app .   # 설명서 보고 틀 만들기
```

### Container = 실제 굽고 있는 붕어빵

Image(틀)로 실제 실행 중인 것. 불 켜지고 지금 동작하는 상태.

```bash
docker run my-app   # 틀로 실행 시작
```

같은 Image로 여러 Container 실행 가능:
```
Image(틀) ──┬──▶ Container 1 (실행 중)
            ├──▶ Container 2 (실행 중)
            └──▶ Container 3 (실행 중)
```

### docker-compose = 분식집 전체 오픈 계획서

서버 하나만으론 동작 안 함. 여러 서비스가 필요:

```
붕어빵 코너  (app   - Node.js 서버)
냉장 창고    (db    - PostgreSQL)
카운터       (redis - 빠른 임시 저장소)
```

docker-compose.yml이 이걸 한 번에 정의:
```
"붕어빵 코너는 이렇게 열고,
 냉장 창고는 저쪽에 두고,
 냉장 창고 준비 끝나면 그때 오픈해라"
```

---

## 파일 구조

```
Dockerfile         Image            Container
(설명서)    ──▶   (붕어빵틀)  ──▶  (굽고 있는 붕어빵)
                                        │
                               docker-compose.yml
                               (분식집 전체 오픈 계획)
```

---

## docker-compose.yml 구성

```yaml
services:
  app:
    build: .              # 현재 폴더 Dockerfile로 이미지 빌드
    ports:
      - "3000:3000"       # 내 컴퓨터 포트:컨테이너 포트
    environment:          # 환경변수 (.env 파일 대신)
      DATABASE_URL: postgresql://postgres:postgres@db:5432/backend_study
      #                                              ^^
      #                              서비스 이름으로 다른 컨테이너 연결
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy  # db 준비 후에 app 시작

  db:
    image: postgres:15-alpine  # Docker Hub에서 기존 이미지 사용
    ports:
      - "5433:5432"       # 로컬 5433 → 컨테이너 5432
    volumes:
      - postgres_data:/var/lib/postgresql/data  # 데이터 영구 저장

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"

volumes:
  postgres_data:          # 컨테이너 꺼져도 DB 데이터 유지
```

**포트 매핑:**
```
내 브라우저                    컨테이너
localhost:3000  ──────────▶  app:3000
localhost:5433  ──────────▶  db:5432
localhost:6380  ──────────▶  redis:6379
```

**서비스 이름으로 통신:**
Docker 내부에서 컨테이너끼리는 서비스 이름(db, redis)으로 찾아감.
`@db:5432`, `redis://redis:6379` 처럼.

---

## Dockerfile 구성

```dockerfile
# 1단계: 빌드 (TypeScript → JavaScript)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2단계: 실행 (빌드 결과물만 담아 가볍게)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev          # 운영에 필요한 패키지만
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
```

**왜 2단계냐:**
```
1단계 (builder)       2단계 (실행)
  TypeScript 컴파일러   필요 없음 (이미 JS로 변환됨)
  devDependencies      필요 없음
  ~500MB               ~150MB (가벼움)
```

---

## .dockerignore

`.gitignore`랑 같은 개념. 이미지에서 제외할 파일.

```
node_modules          # Docker 안에서 새로 설치
dist                  # Docker 안에서 새로 빌드
.env                  # 비밀 정보 절대 포함 금지
!node_modules/.prisma # 단, Prisma 바이너리는 예외 (미리 생성해서 복사)
```

---

## 자주 쓰는 명령어

```bash
# 빌드하고 전체 실행
docker compose up --build

# 백그라운드 실행 (터미널 안 막힘)
docker compose up -d

# 특정 서비스만 실행
docker compose up db redis -d

# 실시간 로그
docker compose logs -f app

# 실행 중인 컨테이너 목록
docker compose ps

# 전체 종료
docker compose down

# 컨테이너 내부 접속 (디버깅용)
docker compose exec app sh
```

---

## 실행 순서 (이 프로젝트)

```bash
# 1. DB, Redis 먼저 시작
docker compose up db redis -d

# 2. 마이그레이션 실행 (로컬에서 Docker DB로)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/backend_study \
NODE_EXTRA_CA_CERTS=/tmp/system-ca.pem \
npx prisma migrate deploy

# 3. 앱 시작
docker compose up app
```

---

## Docker 없이 vs Docker 있을 때

```
Docker 없이                     Docker 있음
──────────────────────────────────────────────
"내 컴퓨터에선 되는데요?"         어디서든 똑같이 실행
Node 버전 수동으로 맞춰야 함       컨테이너 안에 버전 고정됨
DB 따로 설치해야 함               docker compose up 한 번으로 끝
배포 환경 달라서 에러              컨테이너 그대로 서버에 올림
```
