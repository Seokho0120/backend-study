# 데이터베이스

## DB가 왜 필요한가?

서버는 프로그램이라서 껐다 켜면 메모리(변수)가 전부 날아감. DB는 데이터를 영구적으로 저장하는 곳.

```
서버 메모리 (RAM)             DB (하드디스크)
┌─────────────┐               ┌─────────────┐
│ 빠르지만    │               │ 느리지만    │
│ 껐다 켜면   │               │ 껐다 켜도   │
│ 사라짐      │               │ 안 사라짐   │
└─────────────┘               └─────────────┘
  임시 기억                      영구 저장
```

프론트에서 `localStorage`가 브라우저 종료해도 데이터를 유지하는 것처럼, DB는 서버가 꺼져도 데이터를 유지함.

카페 비유로는 **창고**. 바리스타(서버)가 재료를 꺼내 쓰고 다시 넣어두는 곳.
프론트는 창고에 직접 접근할 수 없음 — 반드시 바리스타(서버)를 통해서만.

```
프론트  →  서버  →  DB     (O) 정상
프론트  →  DB          (X) 불가능
```

---

## SQLite (커리큘럼 1에서 사용)

파일 하나가 DB 전체. 설치 없이 `.db` 파일만으로 동작. 학습/소규모용.

```
posts.db  ← 이 파일 하나가 DB
```

실제 서비스에서는 PostgreSQL 같은 서버형 DB를 씀 → 커리큘럼 2에서 전환.

---

## SQL이란?

**DB에게 명령하는 언어.** "이 데이터 줘", "저장해줘", "지워줘" 같은 걸 DB가 알아듣는 문법으로 표현하는 것.

영어 문장이랑 비슷하게 생겨서 읽으면 대충 무슨 뜻인지 느낌이 옴.

```
서버가 DB한테 하는 말:

"posts 테이블에서 전부 가져다줘"
→ SELECT * FROM posts

"id가 1인 게시글 가져다줘"
→ SELECT * FROM posts WHERE id = 1

"새 게시글 저장해줘"
→ INSERT INTO posts (title, content) VALUES ('제목', '내용')

"id가 1인 게시글 제목 바꿔줘"
→ UPDATE posts SET title = '새 제목' WHERE id = 1

"id가 1인 게시글 지워줘"
→ DELETE FROM posts WHERE id = 1
```

---

## 테이블 구조

DB는 엑셀처럼 테이블(표) 형태로 데이터를 저장.

```sql
CREATE TABLE posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,  -- 자동 증가 고유 ID
  title      TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now', 'localtime'))
)
```

---

## 테이블 관계 (Foreign Key)

댓글은 특정 게시글에 속함. `post_id`로 연결 — 1:N 관계.

```
posts 테이블           comments 테이블
id | title            id | post_id | content
1  | 첫 글     ←───  1  |    1    | 좋아요
2  | 두번째    ←───  2  |    1    | 감사해요
                      3  |    2    | 잘봤어요
```

```sql
CREATE TABLE comments (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  content TEXT    NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id)  -- posts.id를 참조
)
```

`FOREIGN KEY`를 설정하면 존재하지 않는 `post_id`를 넣으려 할 때 DB가 거부함.

---

## SQLite vs PostgreSQL

| | SQLite | PostgreSQL |
|--|--------|------------|
| 방식 | 파일 기반 | 서버형 (별도 프로세스) |
| 용도 | 학습, 소규모 | 실제 서비스 |
| 동시 접속 | 제한적 | 수천 명 동시 처리 |
| 설치 | 불필요 | 필요 |

→ 커리큘럼 2에서 PostgreSQL + Prisma로 전환 예정.
