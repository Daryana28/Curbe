import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'
import router from './apps/router/router.js'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initSocket } from './apps/realtime/socket.js'
import { configureWebPushFromEnv } from './apps/realtime/webPush.js'

const envName = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const envPath = path.resolve(process.cwd(), `.env.${envName}`)
const defaultEnvPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(envPath)) {
 dotenv.config({ path: envPath })
} else {
 dotenv.config({ path: defaultEnvPath })
}

const app = express()

app.use(cors())
app.use(cookieParser())

// 🚀 Naikkan limit ke 10MB (bisa disesuaikan)
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))
app.use(express.json({ limit: '100mb' }))

app.use(router)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProduction = process.env.NODE_ENV === 'production'
const keyPath = process.env.SSL_KEY_FILE
  ? path.resolve(__dirname, process.env.SSL_KEY_FILE)
  : isProduction
   ? path.join(__dirname, './cert/pik1com074/private.key')
   : path.join(__dirname, '../fe/cert/dev.key')
const certPath = process.env.SSL_CRT_FILE
  ? path.resolve(__dirname, process.env.SSL_CRT_FILE)
  : isProduction
   ? path.join(__dirname, './cert/pik1com074/certificate.cer')
   : path.join(__dirname, '../fe/cert/dev.crt')

const opt = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
}

var httpsServer = https.createServer(opt, app)
initSocket(httpsServer)
configureWebPushFromEnv()

const port = Number(process.env.PORT || 5009)

httpsServer.on('error', (error) => {
 if (error?.code === 'EADDRINUSE') {
  console.error(`Port ${port} sedang dipakai proses lain. Set PORT di .env atau hentikan proses yang memakai port tersebut.`)
  return
 }

 console.error(error)
})

httpsServer.listen(port, () => console.log(`https running on port ${port} with cert: ${certPath}`))
