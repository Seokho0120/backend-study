# Prisma (ORM)

## ORM이란?

ORM은 **Object Relational Mapper**. SQL 대신 JS 코드로 DB를 조작할 수 있게 해주는 도구.

```
개발자가 작성                내부에서 일어나는 일
──────────────────────────────────────────────────
prisma.post.findMany()  →  Prisma가 SQL로 자동 변환
                        →  SELECT * FROM posts ORDER BY id DESC
                        →  PostgreSQL에 전달
```

Prisma가 SQL을 없애는 게 아니라, 대신 써주는 것.

---

## ORM의 종류

ORM도 여러 종류가 있음. Node.js에서 많이 쓰는 것들:

```
Prisma     → 요즘 가장 인기. 타입 안전, 스키마 기반. 우리가 선택한 것
TypeORM    → TypeScript 프로젝트에 많이 씀. 데코레이터 방식
Sequelize  → 오래된 프로젝트에 많이 남아있음
Knex.js    → ORM보다 얇은 쿼리 빌더. SQL에 더 가까움
```

Prisma를 선택한 이유:
- 스키마 파일 하나로 DB 구조를 한눈에 파악 가능
- 자동완성이 잘 됨
- 마이그레이션 관리가 편함
- 요즘 Node.js 생태계 표준에 가까움

---

## SQL 방식 vs Prisma 방식

```
SQL 직접 작성 (전)                   Prisma (후)
────────────────────────────────────────────────────────
db.prepare(                          prisma.post.findMany({
  'SELECT * FROM posts                 orderBy: { id: 'desc' }
   ORDER BY id DESC'                 })
).all()

db.prepare(                          prisma.post.findUnique({
  'SELECT * FROM posts                 where: { id }
   WHERE id = ?'                     })
).get(id)

db.prepare(                          prisma.post.create({
  'INSERT INTO posts                   data: { title, content, authorId }
   (title, content)                  })
   VALUES (?, ?)'
).run(title, content)
```

SQL 방식의 문제:
- 오타나도 실행 전까진 모름 (`SELCET`, `FORM` 등)
- 자동완성 안 됨
- 테이블 구조 바뀌면 관련 쿼리 전부 수동 수정

---

## 스키마 (schema.prisma)

테이블 구조를 정의하는 파일. 이 파일이 DB의 설계도.

```prisma
model Post {
  id        Int      @id @default(autoincrement())  // PRIMARY KEY, 자동 증가
  title     String                                   // TEXT NOT NULL
  content   String
  createdAt DateTime @default(now()) @map("created_at")  // JS: createdAt, DB: created_at
  author    User?    @relation(fields: [authorId], references: [id])  // User와 관계
  authorId  Int?     @map("author_id")
  comments  Comment[]

  @@map("posts")  // 실제 DB 테이블명은 "posts"
}
```

- `@id` → PRIMARY KEY
- `@default(autoincrement())` → 자동 증가
- `@unique` → 중복 불가
- `@map("컬럼명")` → JS 필드명과 DB 컬럼명을 다르게 설정
- `Post[]` → 1:N 관계 (User 한 명이 Post 여러 개)
- `?` → nullable (없어도 됨)

---

## 마이그레이션이란?

스키마 정의를 실제 DB에 적용하는 것. DB 구조 변경 이력을 관리함.

```
schema.prisma (설계도)              PostgreSQL (실제 DB)
┌──────────────────────┐           ┌──────────────────────┐
│ model User {         │  migrate  │ CREATE TABLE users ( │
│   id    Int @id      │ ────────► │   id SERIAL,         │
│   email String       │           │   email TEXT,        │
│ }                    │           │   ...                │
└──────────────────────┘           └──────────────────────┘
```

변경 이력이 migrations 폴더에 순서대로 쌓임:

```
prisma/migrations/
  20260511_init/
    migration.sql   ← "처음 users, posts, comments 테이블 만들었음"
  20260520_add_like/
    migration.sql   ← "posts에 like 컬럼 추가했음"
```

팀 개발 시 DB 구조가 바뀌면 `npx prisma migrate dev` 한 번으로 동기화됨.

---

## 주요 Prisma 메서드

```js
// 전체 조회
prisma.post.findMany()
prisma.post.findMany({ orderBy: { id: 'desc' } })
prisma.post.findMany({ where: { authorId: 1 } })

// 단건 조회 (없으면 null)
prisma.post.findUnique({ where: { id: 1 } })

// 생성
prisma.post.create({ data: { title, content, authorId } })

// 수정
prisma.post.update({ where: { id: 1 }, data: { title: '새 제목' } })

// 삭제
prisma.post.delete({ where: { id: 1 } })
```

모든 Prisma 메서드는 **async** — `await`으로 결과를 기다려야 함.

---

## db.js 구조

```js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
module.exports = prisma
```

앱 전체에서 하나의 Prisma 인스턴스를 공유. 라우터에서 `require('../db')`로 가져다 씀.
