# HTTP 기초

## 자주 쓰는 요청 헤더

```
요청 헤더
──────────────────────────────────────────────────────
Authorization: Bearer eyJhbGci...   ← 인증 토큰
Content-Type: application/json      ← 바디 형식
Accept: application/json            ← "이 형식으로 응답줘"
Cookie: session_id=abc123           ← 쿠키 (자동 전송)
User-Agent: Mozilla/5.0 ...         ← 어떤 브라우저/클라이언트인지
```

---

## HTTP 요청 구조

HTTP 요청은 두 부분으로 나뉨:

```
┌─────────────────────────────────────┐
│              헤더 (Header)           │  ← 메타정보 (누가, 어떤 형식, 토큰 등)
│  Content-Type: application/json     │
│  Authorization: Bearer xxxxx        │
│  Accept: application/json           │
├─────────────────────────────────────┤
│               바디 (Body)            │  ← 실제 데이터
│  { "title": "제목", "content": "..." }│
└─────────────────────────────────────┘
```

택배 비유:
- **바디** = 택배 상자 안의 물건
- **헤더** = 상자 겉에 붙은 송장 (받는 사람, 내용물 종류, 취급 주의 등)

---

## Content-Type

서버가 바디를 받았을 때 **어떻게 파싱할지** 알려주는 헤더.

```
Content-Type: application/json
→ "바디가 JSON이야, JSON으로 파싱해"
{ "title": "제목" }  → req.body.title 접근 가능

Content-Type: multipart/form-data
→ "바디가 파일+텍스트 혼합이야, 파트별로 나눠서 파싱해"
[파일 데이터]  → req.file 접근 가능

Content-Type: text/plain
→ "바디가 그냥 텍스트야"
hello world  → 문자열 그대로
```

Express에서 `app.use(express.json())` 쓰는 이유가 바로 이것.
`Content-Type: application/json` 인 요청의 바디를 자동으로 파싱해서 `req.body` 에 넣어주는 미들웨어.

---

## 자주 쓰는 Content-Type

```
application/json                  → API 요청/응답 (가장 많이 씀)
multipart/form-data               → 파일 업로드
application/x-www-form-urlencoded → HTML <form> 기본 전송 방식
text/html                         → 웹 페이지
text/plain                        → 일반 텍스트
image/jpeg, image/png             → 이미지 파일
```

프론트에서 `fetch` 로 API 호출할 때 `headers: { 'Content-Type': 'application/json' }` 넣는 게 바로 이것.
"내가 보내는 바디가 JSON이야" 라고 서버에 알려주는 것.

---

## HTTP 상태코드

```
200 OK            → 성공
201 Created       → 생성 성공
400 Bad Request   → 요청이 잘못됨 (필드 누락 등)
401 Unauthorized  → 로그인 필요 (인증 안 됨)
403 Forbidden     → 로그인은 됐지만 권한 없음
404 Not Found     → 리소스 없음
500 Internal Server Error → 서버 내부 오류
```

---

## Authorization 헤더 + Bearer

```
Authorization: <인증방식> <인증값>

인증방식 종류:
  Basic  → ID:PW를 Base64로 인코딩 (옛날 방식, 보안 취약)
  Bearer → 토큰 소지자 인증 (현재 가장 많이 씀)
  Digest → 해시 기반 (거의 안 씀)
```

**Bearer = "소지자"** — "이 토큰을 가진 사람"이라는 뜻.
서버가 Authorization 헤더를 받았을 때 어떤 방식의 인증인지 먼저 알아야 하기 때문에 앞에 붙임.

```
Authorization: Bearer eyJhbGci...
                │       │
         "토큰 소지자    실제 JWT 토큰값
          방식이야"
```

프론트 코드:
```ts
headers: {
  Authorization: `Bearer ${token}`   // "Bearer " (띄어쓰기 포함) + 토큰값
}
```

---

## Session ID — 쿠키 기반 인증

JWT와 완전히 다른 방식의 로그인.

### JWT 방식 (우리 프로젝트)

```
로그인 성공 → 서버가 토큰 생성 → 클라이언트에 줌 (서버에 저장 안 함)

다음 요청 → 클라이언트가 토큰 보냄
          → 서버가 토큰 자체를 검증 (DB 안 봄)
          → "서명이 내가 만든 게 맞네" → 통과
```

### Session 방식 (회사에서 쓰는 방식)

```
로그인 성공
        │
        ▼
서버가 세션 생성 → DB/메모리에 저장
{ session_id: "abc123", userId: 1, expires: ... }
        │
        ▼
클라이언트한테 session_id만 줌 (쿠키로)
Set-Cookie: JSESSIONID=abc123; domain=company.com

다음 요청
        │
        ▼
브라우저가 쿠키 자동으로 보냄
Cookie: JSESSIONID=abc123
        │
        ▼
서버가 "abc123"으로 DB 조회 → { userId: 1 } 찾음 → 로그인 된 사람
```

비유:
- **JWT** = 신분증. 신분증 자체에 정보가 담겨 있고, 서버는 위조 여부만 확인
- **Session** = 물품 보관함 번호표. 번호표(session_id)만 가지고 있고, 실제 물건(유저 정보)은 서버 창고에 있음

---

## 회사 로컬 개발 환경 — 쿠키 domain 문제

쿠키에는 `domain` 속성이 있어서 **설정된 도메인에만 자동 전송**됨.

```
Set-Cookie: JSESSIONID=abc123; domain=company.com
                                │
                        "이 쿠키는 company.com 에서만 써"
```

```
회사 개발서버: api.company.com
로컬:          localhost

브라우저 입장
────────────────────────────────────────────────────
"api.company.com 에서 받은 쿠키야"
"근데 지금 localhost 에서 요청 보내네"
"도메인이 달라 → 쿠키 안 보냄"
→ 로컬에서 로그인이 안 됨
```

해결 방법: DevTools에서 쿠키 domain을 직접 `localhost`로 변경

```
브라우저 DevTools → Application → Cookies
JSESSIONID: abc123
  domain: company.com  →  localhost 로 변경
                              │
                              ▼
이제 localhost 에서 요청할 때도 쿠키 전송됨 → 로그인 유지
```

---

## JWT vs Session 비교

```
JWT                                Session
────────────────────────────────   ────────────────────────────────
서버에 저장 없음                    서버 DB/메모리에 저장
토큰 자체에 정보 포함               session_id는 열쇠, 정보는 서버에
Authorization 헤더로 전송           Cookie로 자동 전송
모바일 앱, API 서버에 적합          웹 브라우저 기반 서비스에 많이 씀
로그아웃 처리 까다로움              서버에서 세션 삭제하면 즉시 로그아웃
서버 확장(멀티 서버) 쉬움           서버 확장 시 세션 공유 필요 (Redis 등)
```

오래된 서비스일수록 Session 방식을 그대로 유지하는 경우가 많고,
최근에 만들어지는 API 서버들은 대부분 JWT 방식으로 감.
