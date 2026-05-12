# 파일 업로드

## 왜 JSON으로 파일을 못 보내나

지금까지 모든 요청은 이렇게 했어요:

```
POST /posts
Content-Type: application/json

{ "title": "제목", "content": "내용" }
```

JSON은 **텍스트**만 담을 수 있어요. 이미지 파일은 0과 1로 이루어진 **바이너리 데이터**라서 JSON에 넣을 수 없어요.

그래서 파일 전송 전용 형식이 따로 있어요:

```
일반 요청                          파일 요청
────────────────────────────────   ────────────────────────────────
Content-Type: application/json     Content-Type: multipart/form-data
{ "title": "..." }                 ──파트1──
                                   title: 제목
                                   ──파트2──
                                   file: [바이너리 데이터]
```

`multipart/form-data` = 여러 파트(텍스트 + 파일)를 한 요청에 나눠서 담는 형식.
프론트에서 `<input type="file">` 로 파일 선택 후 `FormData` 객체로 보내면 이 방식으로 전송됨.

---

## 파일을 어디에 저장하나

```
로컬 디스크 (개발용)               클라우드 스토리지 (실무)
────────────────────────────────   ────────────────────────────────
서버 컴퓨터의 uploads/ 폴더        AWS S3, Cloudinary 등 외부 서버
http://localhost:3000/uploads/     https://cdn.example.com/image.jpg
  1715475832000.jpg

장점: 설정 간단, 추가 비용 없음    장점: 서버 재배포해도 파일 유지
단점: 서버 재배포 시 파일 사라짐         URL 하나로 전 세계 어디서든 접근
     서버 용량을 파일이 차지              트래픽 분산 (CDN)
```

---

## multer — 파일 처리 미들웨어

Express에서 파일 업로드를 처리하는 가장 많이 쓰이는 라이브러리.
authMiddleware처럼 요청이 라우터에 닿기 전에 가로채서 파일을 처리해줌.

```
POST /upload (multipart/form-data)
        │
        ▼
authMiddleware
  JWT 확인 → req.user 세팅
        │
        ▼
upload.single('file')   ← multer 미들웨어
  요청에서 파일 꺼냄
  uploads/ 폴더에 저장
  req.file 에 파일 정보 담아줌
        │
        ▼
라우터 핸들러
  req.file.filename → '1715475832000.jpg'
  req.file.size     → 102400
  URL 응답으로 반환
```

---

## 파일 구조

```
src/
  lib/
    upload.ts     ← multer 설정 분리 (재사용 가능하도록)
  routes/
    upload.ts     ← POST /upload 엔드포인트

uploads/          ← 업로드된 파일 저장 (자동 생성)
  1715475832000.jpg
  1715475900000.png
```

---

## multer 설정 3가지 (src/lib/upload.ts)

```ts
storage    → 저장 위치: uploads/ 폴더
             파일명: Date.now() + 확장자  (예: 1715475832000.jpg)
             → 같은 이름 파일 올려도 타임스탬프로 구분됨

fileFilter → jpeg / png / webp / gif 만 허용
             그 외 파일 → "이미지 파일만 업로드 가능합니다." 오류

limits     → 5MB 초과 시 자동 거절
```

---

## 업로드 후 파일 접근

```
업로드 응답
{ "url": "/uploads/1715475832000.jpg" }
        │
        ▼
브라우저에서
http://localhost:3000/uploads/1715475832000.jpg
        │
        ▼
index.ts의 정적 파일 서빙
app.use('/uploads', express.static(...))
→ uploads/ 폴더를 URL로 바로 접근 가능하게 열어줌
```

정적 파일 서빙 = 폴더를 웹 서버처럼 공개하는 것.
nginx가 HTML/CSS/JS 파일 서빙하는 것과 같은 원리.

---

## 테스트 흐름

```
1. npm run dev 로 서버 시작
2. POST /auth/login 으로 토큰 발급
3. POST /upload 에 토큰 + 이미지 파일 전송
4. 응답받은 url을 브라우저에 입력 → 이미지 확인
```

```bash
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer <토큰>" \
  -F "file=@/경로/이미지.jpg"
```
