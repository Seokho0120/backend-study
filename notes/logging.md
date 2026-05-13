# 로깅 (morgan / winston)

## 왜 필요한가

`console.log`는 터미널에 찍고 끝 — 서버 껐다 켜면 사라짐.
로깅은 요청/에러 기록을 **파일에 체계적으로 저장**해서 나중에도 확인 가능하게 함.

```
요청 들어옴 → 처리 → 응답
              ↑
          아무 기록 없음  ← 이 문제를 해결
```

---

## 도구 두 가지

| 도구 | 역할 | 비유 |
|------|------|------|
| **morgan** | HTTP 요청/응답 자동 기록 | CCTV |
| **winston** | 앱 내부 로그 직접 기록 | 업무일지 |

```
클라이언트 → [morgan 자동 기록] → 서버 처리 → 응답
                                       ↓
                               [winston 직접 기록]
```

---

## 로그 레벨 (winston)

```
error   → 즉시 확인 필요한 에러
warn    → 경고
info    → 일반 정보 (서버 시작 등)
debug   → 개발 중 상세 정보 (운영 환경에서는 꺼짐)
```

숫자가 낮을수록 심각. `level: 'info'`로 설정하면 info 이상만 출력.

---

## 파일 구조

```
src/lib/logger.ts    ← winston 인스턴스 설정
src/index.ts         ← morgan 연결, logger 사용

logs/
  combined.log       ← info 이상 전부 저장
  error.log          ← error만 저장
```

---

## 설정 코드

```typescript
// src/lib/logger.ts
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console(),              // 터미널 출력
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})
```

```typescript
// src/index.ts
app.use(morgan('dev'))         // 모든 HTTP 요청 자동 기록
logger.info('서버 시작')       // 직접 찍는 로그
logger.error('에러 발생')      // 에러 로그 → 파일에도 저장
```

---

## morgan 출력 형식 ('dev')

```
GET /posts 200 12.345 ms - 512
POST /auth/login 401 5.123 ms - 45
```

메서드 / 경로 / 상태코드 / 응답시간 / 응답크기

---

## 주의

- `logs/` 폴더는 `.gitignore`에 추가 (용량 크고 환경마다 다름)
- morgan은 파일에 저장 안 됨 (터미널 출력만) — 파일에도 저장하려면 morgan을 winston에 연결하는 추가 설정 필요
