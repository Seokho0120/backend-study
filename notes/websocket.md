# WebSocket & socket.io

## WebSocket이 뭔가

**한 번 연결하면 끊기 전까지 서버(Express)와 클라이언트(브라우저)가 자유롭게 양방향 대화하는 통신 방식**

### HTTP vs WebSocket — 문자 vs 전화

```
HTTP (지금까지)
  손님(클라이언트)이 말 걸 때만 대화 가능
  손님(클라이언트): "게시글 줘" → 바리스타(서버): "여기" → 연결 끊김
  손님(클라이언트): "또 줘" → 바리스타(서버): "여기" → 연결 끊김
  → 서버(Express)가 먼저 말 걸 수 없음

WebSocket
  한 번 연결하면 전화 통화처럼 계속 연결 유지
  바리스타(서버): "새 메시지 왔어요!" (서버가 먼저 말 걸 수 있음)
  손님A(클라이언트): "감사해요"
  바리스타(서버): "손님B한테도 동시에 전달!" (여러 명 동시에)
```

### 언제 쓰나

```
WebSocket 써야 하는 것            HTTP로 충분한 것
──────────────────────────────    ──────────────────────────────
실시간 채팅                        게시글 목록 조회
실시간 알림                        로그인
주식/코인 시세                     파일 업로드
멀티플레이 게임                    일반 CRUD API
협업 툴 (Notion 실시간 편집)
```

---

## socket.io

WebSocket을 날것으로 쓰면 복잡함. socket.io는 WebSocket을 쉽게 쓸 수 있게 감싸준 라이브러리.

```bash
npm install socket.io
```

---

## 구조 변경 — http.createServer 필요

socket.io는 Express 앱(app.ts)이 아닌 **HTTP 서버**에 붙여야 함.

```
변경 전:  app.listen(3000)  ← Express가 직접 서버 생성
변경 후:  http.createServer(app) → socket.io 붙이기 → server.listen(3000)
```

```typescript
// index.ts
import http from 'http'
import { Server } from 'socket.io'
import app from './app'

const server = http.createServer(app)   // HTTP 서버 직접 생성
const io = new Server(server, {
  cors: { origin: '*' }                 // 모든 출처에서 연결 허용
})

server.listen(3000)
```

---

## 이벤트 기반 통신

socket.io는 이벤트를 주고받는 방식으로 동작함. 프론트의 addEventListener와 비슷한 개념.

```
emit('이벤트명', 데이터)   → 이벤트 전송
on('이벤트명', 콜백)       → 이벤트 수신
```

### 서버 (index.ts)

```typescript
io.on('connection', (socket) => {
  // 새 클라이언트(브라우저)가 연결됐을 때

  socket.on('join', (room) => {
    socket.join(room)                    // 특정 채팅방에 입장
    io.to(room).emit('message', { ... }) // 방 전체에 브로드캐스트
  })

  socket.on('message', ({ room, user, text }) => {
    io.to(room).emit('message', { user, text })  // 방 전체에 메시지 전달
  })

  socket.on('disconnect', () => {
    // 클라이언트(브라우저) 연결 끊겼을 때
  })
})
```

### 클라이언트 (chat.html)

```javascript
const socket = io()   // 서버에 WebSocket 연결

// 채팅방 입장
socket.emit('join', room)

// 메시지 전송
socket.emit('message', { room, user: myName, text })

// 메시지 수신 (서버가 보낸 것)
socket.on('message', ({ user, text }) => {
  // 화면에 메시지 표시
})
```

---

## emit 범위 — 누구한테 보낼지

```
io.emit(...)              → 연결된 모든 클라이언트(브라우저)에게
io.to(room).emit(...)     → 특정 방에 있는 모두에게 (발신자 포함)
socket.to(room).emit(...) → 특정 방에 있는 모두에게 (발신자 제외)
socket.emit(...)          → 해당 클라이언트(브라우저)에게만
```

---

## 채팅방(room) 개념

같은 채팅방 이름으로 입장한 소켓끼리만 메시지를 주고받음.

```
room: "general"에 있는 사람 → A, B, C
room: "random"에 있는 사람  → D, E

A가 "general"에 메시지 보내면 → B, C만 받음 (D, E는 못 받음)
```

---

## 실시간 동작 흐름

```
탭A(클라이언트)에서 메시지 전송
      ↓
socket.emit('message', { room, user, text })
      ↓
서버(socket.io)가 받음
      ↓
io.to(room).emit('message', { user, text })
      ↓
같은 room에 있는 탭A, 탭B 동시에 'message' 이벤트 수신
      ↓
양쪽 화면에 메시지 동시에 출력
```

---

## 주의: 새로고침하면 채팅 기록 사라짐

현재는 메시지를 메모리에만 저장함.

```
현재:   메시지 → 서버(메모리) → 브라우저 출력
        새로고침 시 이전 메시지 없음

실서비스: 메시지 → 서버 → DB(PostgreSQL) 저장 + 브라우저 출력
         새로고침 시 DB에서 이전 메시지 불러옴
```

---

## 한글 IME + Enter 이슈

한글 입력 중 Enter 누르면 이벤트가 두 번 발생함:
1. IME가 마지막 글자 조합 완성하면서 Enter 이벤트 발생 → 메시지 전송
2. 실제 Enter 키 이벤트 발생 → 남은 글자 전송

**해결:** `event.isComposing` 체크로 IME 조합 중일 때 Enter 무시

```javascript
// 잘못된 방법
onkeydown="if(event.key==='Enter') sendMessage()"

// 올바른 방법
onkeydown="if(event.key==='Enter' && !event.isComposing) sendMessage()"
```
