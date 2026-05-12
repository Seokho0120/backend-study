# HTTP 기초

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
