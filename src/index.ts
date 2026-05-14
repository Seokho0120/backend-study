import http from 'http'
import { Server } from 'socket.io'
import app from './app'
import logger from './lib/logger'

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' }
})

io.on('connection', (socket) => {
  logger.info(`소켓 연결: ${socket.id}`)

  socket.on('join', (room: string) => {
    socket.join(room)
    io.to(room).emit('message', {
      user: '시스템',
      text: `새로운 사용자가 입장했습니다.`,
    })
  })

  socket.on('message', ({ room, user, text }: { room: string; user: string; text: string }) => {
    io.to(room).emit('message', { user, text })
  })

  socket.on('disconnect', () => {
    logger.info(`소켓 연결 해제: ${socket.id}`)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  logger.info(`서버 실행 중: http://localhost:${PORT}`)
})
