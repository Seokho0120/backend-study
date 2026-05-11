# TypeScript

## TypeScript란?

JavaScript에 **타입을 강제로 명시**하게 만든 언어. MS가 만들었고, JS의 상위 집합이라 JS 코드는 그대로 TS에서 동작.

```
JS 실수 발생 시점:   서버 실행 중 → 요청 왔을 때 → 터짐 (사용자가 겪음)
TS 실수 발생 시점:   코드 작성 중 → 바로 빨간 줄 → 개발자가 미리 수정
```

---

## 타입이란?

"이 값이 어떤 종류의 데이터인가"를 명시하는 것.

```ts
let name: string = "김철수"     // 문자열만 가능
let age: number = 25            // 숫자만 가능
let active: boolean = true      // true/false만 가능
```

JS는 같은 변수에 뭐든 넣을 수 있지만, TS는 타입이 다르면 에러.

---

## 타입 언어 생태계

```
타입 없음 (동적 타입)               타입 있음 (정적 타입)
────────────────────────────────   ────────────────────────────────
JavaScript, Python, Ruby           TypeScript, Java, Go, Kotlin, Rust

장점: 빠르게 작성                   장점: 실수를 실행 전에 잡아줌
      소규모에 편함                        자동완성 정확, 팀 개발 유리
단점: 규모 커질수록 관리 어려움     단점: 초반에 타입 작성 번거로움
```

요즘 실제 서비스는 거의 TypeScript. 대부분의 회사 프론트/백엔드가 TS 기반.

---

## JS → TS 문법 변화

### import/export (ES Module)

```js
// 전 (CommonJS)
const express = require('express')
module.exports = router

// 후 (ES Module)
import express from 'express'
export default router
```

### 함수 타입 명시

```ts
import { Request, Response, NextFunction } from 'express'

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  // req, res, next가 각각 어떤 타입인지 명시
})
```

### 인터페이스 — 객체의 타입 정의

```ts
// req에 user 필드를 추가한 커스텀 타입
interface AuthRequest extends Request {
  user?: { id: number; email: string }
}
// req.user.id 쓸 때 id가 number임을 TS가 알고 자동완성해줌
```

### 타입 단언 (as)

```ts
// TS에게 "이건 무조건 string이야"라고 알려주는 것
parseInt(req.params.id as string)
```

---

## TS가 실제로 잡아준 오류 사례

```ts
// Express 5에서 req.params.id 타입
req.params.id  →  string | string[]  // 문자열 또는 문자열 배열

parseInt(req.params.id)
// TS 에러: parseInt는 string만 받는데 string[] 가능성 있음

// JS였으면 그냥 통과 → 런타임에서 터질 수 있음
// TS가 미리 잡아줌 → 코드 작성 중에 수정
```

---

## tsconfig.json

TypeScript 컴파일러 설정 파일.

```json
{
  "compilerOptions": {
    "rootDir": "./src",    // TS 파일 위치 (내가 작성하는 곳)
    "outDir": "./dist",    // 컴파일된 JS 파일 위치 (자동 생성)
    "strict": true,        // 엄격한 타입 체크
    "module": "commonjs"   // Node.js용 출력 형식
  }
}
```

---

## 컴파일이란?

Node.js는 JS를 실행하지 TS를 직접 실행하지 못함. TS → JS 변환 과정이 필요.

```
TS 작성 → tsc(컴파일러)로 JS 변환 → Node.js가 JS 실행

src/index.ts   →   dist/index.js
src/routes/    →   dist/routes/
```

개발 중엔 `ts-node`로 컴파일 없이 바로 실행 가능.

---

## 스크립트

```json
"scripts": {
  "dev":   "ts-node src/index.ts",   // 개발할 때 (컴파일 없이 바로 실행)
  "build": "tsc",                    // 배포 전 JS로 컴파일
  "start": "node dist/index.js"      // 배포 서버에서 실행
}
```

---

## 프로젝트 구조 변화

```
전                        후
──────────────────────────────────────────
index.js                  src/
routes/auth.js              index.ts
routes/posts.js    →        routes/auth.ts
routes/comments.js          routes/posts.ts
middleware/auth.js          routes/comments.ts
db.js                       middleware/auth.ts
                            db.ts
                          dist/  (컴파일 결과물, git 제외)
```
