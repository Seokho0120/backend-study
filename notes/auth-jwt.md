# 인증 (Authentication)

## 왜 인증이 필요한가?

HTTP는 기본적으로 stateless — 요청마다 "누가 보낸 건지" 모름.
로그인한 사용자만 글을 쓰거나, 자기 글만 수정하려면 "이 요청이 누구 것인지" 서버가 알아야 함.

---

## 전체 흐름

```
[회원가입]
POST /auth/register
  → 비밀번호를 bcrypt로 해시
  → 이메일 + 해시된 비밀번호를 DB에 저장

[로그인]
POST /auth/login
  → DB에서 이메일로 유저 조회
  → bcrypt.compare(입력한 비번, DB의 해시) 로 일치 여부 확인
  → 일치하면 JWT 토큰 발급해서 프론트에 전달

[이후 요청]
  → 프론트가 헤더에 토큰 첨부: Authorization: Bearer <토큰>
  → 서버가 jwt.verify()로 토큰 검증
  → 통과하면 req.user에 유저 정보 저장 → 라우터에서 사용
```

---

## bcrypt — 비밀번호 해시

비밀번호를 그대로 DB에 저장하면 DB가 털렸을 때 전부 노출됨.
bcrypt는 비밀번호를 복호화할 수 없는 형태로 변환함.

```js
// 회원가입 시 — 해시 생성
const hashed = await bcrypt.hash(password, 10) // 10 = 해시 강도(saltRounds)
// DB에는 hashed 값을 저장

// 로그인 시 — 비교
const isMatch = await bcrypt.compare(inputPassword, hashedFromDB)
// true / false 반환
```

같은 비밀번호라도 해시할 때마다 다른 값이 나옴. 그래서 원본 비교가 아니라 `compare`를 써야 함.

---

## JWT (JSON Web Token)

로그인 성공 후 서버가 발급하는 "인증 증표". 프론트에서 localStorage 등에 저장해두고 요청마다 헤더에 첨부.

**토큰 구조 (3파트를 `.`으로 구분):**
```
eyJhbGci...   .   eyJpZCI6MSwiZW1...   .   서명값
    헤더              페이로드                서명
```

- **헤더**: 알고리즘 정보
- **페이로드**: 실제 데이터 (유저 id, email 등). Base64 인코딩이라 누구나 열어볼 수 있음
- **서명**: 헤더+페이로드를 JWT_SECRET으로 서명. 위조 방지 역할

페이로드는 암호화가 아니라 인코딩이므로 민감한 정보(비밀번호 등)는 넣으면 안 됨.

```js
// 토큰 발급 (로그인 성공 시)
const token = jwt.sign(
  { id: user.id, email: user.email }, // 페이로드
  JWT_SECRET,                          // 서명 키
  { expiresIn: '1h' }                  // 만료 시간
)

// 토큰 검증 (요청마다 미들웨어에서)
const decoded = jwt.verify(token, JWT_SECRET)
req.user = decoded // { id, email, iat, exp }
```

---

## JWT_SECRET

토큰 서명/검증에 쓰는 비밀 키. 이 값이 유출되면 누구든 유효한 토큰을 위조할 수 있음.

- 코드에 직접 쓰면 안 됨 → 환경변수로 관리 (커리큘럼 2에서 적용)
- 서버 시작 시 1회 설정, 절대 변경하지 않음 (바꾸면 기존 토큰 전부 무효화)

---

## 인증 미들웨어

보호된 라우트(글 작성, 수정, 삭제 등)에 적용. 토큰이 없거나 유효하지 않으면 401 반환.

```js
// middleware/auth.js
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization       // "Bearer <토큰>"
  const token = authHeader?.split(' ')[1]            // 토큰만 추출

  if (!token) return res.status(401).json({ message: '토큰 없음' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded  // 이후 라우터에서 req.user.id 로 접근
    next()
  } catch {
    res.status(401).json({ message: '유효하지 않은 토큰' })
  }
}
```
