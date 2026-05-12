# 권한 처리 (Authorization)

## 인증 vs 권한 — 핵심 차이

```
인증 (Authentication)          권한 (Authorization)
────────────────────────────   ────────────────────────────
"넌 누구야?"                   "넌 이걸 할 수 있어?"
로그인, JWT 토큰 확인           내 리소스인지 확인

401 Unauthorized               403 Forbidden
→ 로그인 안 된 상태             → 로그인은 됐지만 권한 없음
```

카페 비유:
- **인증** = 멤버십 카드로 회원 확인 (넌 회원이구나)
- **권한** = 이 테이블은 VIP 전용 (회원이어도 이 자리는 못 앉아)

---

## HTTP 상태코드

```
200 OK          → 성공
201 Created     → 생성 성공
400 Bad Request → 요청이 잘못됨 (필드 누락 등)
401 Unauthorized → 로그인 필요
403 Forbidden   → 로그인은 됐지만 이 작업은 권한 없음
404 Not Found   → 리소스 없음
```

---

## 요청 흐름

```
PATCH /posts/3   (헤더: Authorization: Bearer <토큰>)
        │
        ▼
authMiddleware
  토큰 검증 → req.user = { id: 2, email: "a@a.com" } 세팅
        │
        ▼
게시글 조회
  post = { id: 3, title: "...", authorId: 5 }
        │
        ▼
권한 확인
  post.authorId(5) !== req.user.id(2)
        │
   다른 사람          내 글
        │               │
  403 반환          수정 허용
```

---

## 구현 포인트

### 1. DB 스키마 — 작성자 id 저장

```prisma
model Comment {
  ...
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?     @map("author_id")   // 누가 썼는지 기록
}
```

Post에는 원래 있었지만 Comment에는 없었음 → 추가.
`authorId` 없으면 나중에 "내 댓글인지" 확인할 방법이 없음.

### 2. 권한 확인 코드

```ts
const post = await prisma.post.findUnique({ where: { id } })
if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' })
if (post.authorId !== req.user!.id) return res.status(403).json({ message: '권한이 없습니다.' })
// 여기까지 통과하면 내 글임 → 수정/삭제 허용
```

순서가 중요:
1. 존재 확인 (404)
2. 권한 확인 (403)
3. 실제 처리

### 3. `req.user!.id` — 느낌표의 의미

```ts
req.user!.id
//      ^
//  TypeScript에게 "user가 절대 undefined 아님"을 단언
//  authMiddleware를 통과했으면 반드시 세팅돼 있으므로 안전
```

---

## 전후 비교

```
이전                                   이후
─────────────────────────────────────  ─────────────────────────────────────
게시글 수정: 로그인만 하면 누구든 가능  게시글 수정: 내가 쓴 글만 가능
게시글 삭제: 로그인만 하면 누구든 가능  게시글 삭제: 내가 쓴 글만 가능
댓글 작성: 로그인 불필요               댓글 작성: 로그인 필요
댓글 삭제: 로그인 불필요               댓글 삭제: 내가 쓴 댓글만 가능
```

---

## Prisma 마이그레이션

스키마 변경 후에는 반드시 마이그레이션 실행:

```bash
npx prisma migrate dev --name 변경내용설명
# → DB 테이블 변경 + Prisma 클라이언트 타입 자동 재생성
```

IDE에서 타입 에러가 남아있으면 → `Cmd+Shift+P` → `TypeScript: Restart TS Server`
(컴파일러는 정상이지만 IDE 캐시가 이전 타입을 보고 있는 경우)
