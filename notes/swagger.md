# API 문서화 (Swagger)

## 왜 필요한가

API가 많아지면 "이 API 어떻게 써요?"를 매번 코드 보거나 말로 설명해야 함.
Swagger는 코드 주석에서 자동으로 **브라우저 문서 + 테스트 도구**를 생성해줌.

```
전에는:  curl 명령어로 직접 테스트
지금은:  브라우저에서 버튼 클릭으로 테스트 + 문서 자동 생성
```

---

## 동작 흐름

```
라우트 파일의 @swagger 주석
          ↓
    swagger-jsdoc가 읽어서 JSON 스펙 생성
          ↓
  swagger-ui-express가 UI로 렌더링
          ↓
  http://localhost:3000/api-docs
```

---

## 파일 구조

```
src/lib/swagger.ts     ← Swagger 설정 (어떤 파일 읽을지, 프로젝트 정보)
src/routes/*.ts        ← @swagger 주석 작성
src/index.ts           ← /api-docs 경로에 UI 연결
```

---

## 설정 코드

```typescript
// src/lib/swagger.ts
const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./src/routes/*.ts'],  // 주석 읽을 파일 경로
}
```

```typescript
// src/index.ts
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
```

---

## 주석 구조

```typescript
/**
 * @swagger
 * /posts:               ← URL 경로
 *   post:               ← HTTP 메서드
 *     summary: 설명     ← 한줄 설명
 *     tags: [Posts]     ← 그룹 이름
 *     security:
 *       - bearerAuth: []  ← 자물쇠 아이콘 (토큰 필요)
 *     requestBody:      ← 요청 body
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: 성공
 *       401:
 *         description: 인증 필요
 */
```

---

## UI에서 JWT 인증하는 방법

```
1. /auth/login → Try it out → Execute
2. 응답에서 token 값 복사
3. 우상단 Authorize 버튼 → 토큰 붙여넣기
4. 자물쇠 달린 API 바로 테스트 가능
```

---

## 실무에서 쓰는 이유

프론트-백 협업 시 Swagger 링크 하나 공유하면
요청 형식 / 응답 형식 / 인증 방법이 전부 문서화되고 직접 테스트도 가능.
