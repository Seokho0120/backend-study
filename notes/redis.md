# Redis 캐싱

## Redis가 뭔가

**메모리(RAM)에 데이터를 저장하는 초고속 임시 저장소**

### 음식점 비유

```
손님: "오늘 메뉴가 뭐예요?"

Redis 없을 때:
  매번 주방(DB)에 들어가서 셰프한테 물어보고 나와서 대답
  → 손님이 많아지면 셰프가 바빠서 응답이 느려짐

Redis 있을 때:
  카운터(Redis)에 메뉴판을 하나 붙여둠
  → 손님이 물어보면 카운터에서 바로 대답
  → 셰프(DB)는 바쁠 때만 호출
```

---

## PostgreSQL vs Redis — 창고 vs 책상

```
PostgreSQL = 창고
  - 모든 데이터 영구 보관
  - 꺼내려면 창고까지 걸어가야 함 (느림)
  - 서버 꺼져도 데이터 남음

Redis = 책상 위
  - 자주 쓰는 것만 임시 보관
  - 손만 뻗으면 바로 꺼낼 수 있음 (빠름)
  - 서버 꺼지면 사라짐
```

Redis는 "없어져도 되는 임시 데이터"에만 사용.
DB에 원본이 있고, 빠르게 보여주기 위해 잠깐 책상 위에 올려두는 것.

---

## 캐싱 흐름 — 편의점 비유

```
첫 번째 손님이 "삼각김밥 있어요?" 물어봄
  → 창고(DB)까지 가서 확인
  → 있네, 카운터 앞(Redis)에 꺼내다 놓자
  → "있어요" 대답

두 번째, 세 번째 손님
  → 카운터 앞(Redis)에 이미 꺼내져 있음
  → 창고 안 가도 바로 "있어요" 대답 (훨씬 빠름)

유통기한(TTL) 지나면
  → 카운터 앞 삼각김밥 치움
  → 다음 손님이 물어보면 다시 창고 가서 확인
```

코드로 보면:

```typescript
const cached = await redis.get(cacheKey)

if (cached) {
  // 카운터 앞에 있음 → 바로 대답
  res.json(JSON.parse(cached))
  return
}

// 카운터에 없음 → 창고(DB) 가서 꺼내옴
const result = await prisma.post.findMany(...)

// 다음 손님을 위해 카운터에 꺼내다 놓기 (60초 유지)
await redis.set(cacheKey, JSON.stringify(result), 'EX', 60)
```

---

## 캐시 키 — 라벨 붙이기

카운터에 여러 물건을 올려둘 때 라벨이 없으면 뭐가 뭔지 모름.

```typescript
const cacheKey = `posts:${page}:${limit}:${search ?? ''}`
// "posts:1:10:"      → 1페이지, 10개, 검색 없음
// "posts:2:10:"      → 2페이지, 10개, 검색 없음
// "posts:1:10:공지"  → 1페이지, 10개, '공지' 검색
```

파라미터가 다르면 다른 응답 → 다른 캐시 키.

---

## TTL (Time To Live) — 유통기한

```typescript
await redis.set(cacheKey, JSON.stringify(result), 'EX', 60)
//                                                  ^^   ^^
//                                             유통기한  60초
```

60초 지나면 Redis가 알아서 해당 캐시를 삭제.
TTL 없으면 캐시가 계속 쌓여서 Redis 메모리가 꽉 참.

---

## 캐시 무효화 — 재고가 바뀌면 카운터도 갱신

캐싱에서 제일 중요하고 제일 어려운 부분.

```
1. 카운터에 "게시글 10개" 올려둠
2. 누군가 새 글 작성 → DB에는 11개
3. 다음 손님 요청 → 카운터 확인 → "10개" 응답 → 틀린 정보!
```

글이 추가/수정/삭제될 때마다 관련 캐시를 전부 삭제:

```typescript
const keys = await redis.keys('posts:*')    // "posts:"로 시작하는 키 전부 찾기
if (keys.length > 0) await redis.del(...keys)  // 전부 삭제
```

```
너무 자주 삭제 → 매번 창고 가야 함 → 캐시 의미 없음
너무 안 삭제   → 오래된 데이터가 사용자한테 보임
```

우리 전략: 글이 바뀔 때 삭제 + TTL 60초 자동 만료.

---

## 실제 속도 차이

```
DB 조회:    0.158초
Redis 조회: 0.012초  ← 약 13배 빠름
```

데이터가 많아지고 동시 접속자가 늘수록 차이가 더 커짐.

---

## 설치

```bash
brew install redis      # Redis 서버 설치
brew services start redis  # Redis 서버 실행
redis-cli ping          # → PONG 뜨면 정상

npm install ioredis     # Node.js에서 Redis 쓰는 패키지
```

## 파일 구조

```
src/lib/redis.ts   Redis 클라이언트 (db.ts의 Prisma 클라이언트와 같은 역할)
src/routes/posts.ts  GET /posts에 캐싱 적용, POST/PATCH/DELETE에 캐시 무효화
```

### redis.ts

```typescript
import Redis from 'ioredis'

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,          // Redis 기본 포트
})

export default redis
```

---

## 전체 흐름

```
GET /posts 요청
      ↓
카운터(Redis) 확인
  ├── 있음: 바로 응답 (창고 안 감)
  └── 없음
        ↓
      창고(DB) 조회
        ↓
      카운터에 올려놓기 (60초 유통기한)
        ↓
      응답

글 작성/수정/삭제
      ↓
DB 변경
      ↓
카운터 물건 전부 치우기 (캐시 삭제)
      ↓
다음 GET 요청 때 창고 가서 새로 올려놓음
```
