import { emitNotification } from '../realtime/socket.js'
import {
 addSubscription,
 getSubscriptionCount,
 getWebPushPublicKey,
 removeSubscription,
 sendWebPushNotification
} from '../realtime/webPush.js'

export function GetWebPushPublicKey(req, res) {
 const publicKey = getWebPushPublicKey()
 if (!publicKey) {
  return res.status(503).json({ status: 0, msg: 'Web push belum dikonfigurasi' })
 }
 return res.json({ status: 1, publicKey })
}

export function SubscribeWebPush(req, res) {
 const subscription = req.body?.subscription || req.body
 const ok = addSubscription(subscription)

 if (!ok) {
  return res.status(400).json({ status: 0, msg: 'Subscription tidak valid' })
 }

 return res.json({
  status: 1,
  msg: 'Subscription tersimpan',
  total: getSubscriptionCount()
 })
}

export function UnsubscribeWebPush(req, res) {
 const endpoint = req.body?.endpoint
 if (!endpoint) {
  return res.status(400).json({ status: 0, msg: 'endpoint wajib diisi' })
 }

 removeSubscription(endpoint)
 return res.json({
  status: 1,
  msg: 'Subscription dihapus',
  total: getSubscriptionCount()
 })
}

export async function BroadcastNotification(req, res) {
 const payload = {
  title: req.body?.title || 'Notifikasi',
  message: req.body?.message || req.body?.msg || 'Ada pembaruan baru.',
  url: req.body?.url || '/'
 }

 const socketClients = emitNotification(payload)
 const webpushResult = await sendWebPushNotification(payload)

 return res.json({
  status: 1,
  msg: 'Notifikasi dikirim',
  socketClients,
  webpush: webpushResult
 })
}

