import { Server } from 'socket.io'

let ioInstance = null

function resolveCorsOrigin() {
 const raw = process.env.SOCKET_CORS_ORIGIN
 if (!raw) return true
 const origins = raw
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
 return origins.length > 0 ? origins : true
}

export function initSocket(server) {
 if (ioInstance) return ioInstance

 ioInstance = new Server(server, {
  cors: {
   origin: resolveCorsOrigin(),
   credentials: true
  },
  transports: ['websocket', 'polling']
 })

 ioInstance.on('connection', () => {})

 return ioInstance
}

export function getSocket() {
 return ioInstance
}

export function emitNotification(payload = {}) {
 if (!ioInstance) return 0

 const data = {
  title: payload.title || 'Notifikasi',
  message: payload.message || payload.msg || 'Ada pembaruan baru.',
  ...payload
 }

 ioInstance.emit('notification', data)
 return ioInstance.engine.clientsCount || 0
}
