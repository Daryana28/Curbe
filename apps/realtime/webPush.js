import webpush from 'web-push'

const subscriptions = new Map()

function getVapidConfig() {
 return {
  subject: process.env.WEB_PUSH_SUBJECT || 'mailto:admin@example.com',
  publicKey: process.env.WEB_PUSH_PUBLIC_KEY,
  privateKey: process.env.WEB_PUSH_PRIVATE_KEY
 }
}

export function configureWebPushFromEnv() {
 const cfg = getVapidConfig()
 if (!cfg.publicKey || !cfg.privateKey) {
  console.warn('WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY belum di-set, web-push dinonaktifkan')
  return false
 }

 webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey)
 return true
}

export function getWebPushPublicKey() {
 return process.env.WEB_PUSH_PUBLIC_KEY || ''
}

export function addSubscription(subscription) {
 if (!subscription?.endpoint) return false
 subscriptions.set(subscription.endpoint, subscription)
 return true
}

export function removeSubscription(endpoint) {
 if (!endpoint) return false
 return subscriptions.delete(endpoint)
}

export function getSubscriptionCount() {
 return subscriptions.size
}

export async function sendWebPushNotification(payload = {}) {
 if (subscriptions.size === 0) {
  return { sent: 0, failed: 0 }
 }

 const message = JSON.stringify({
  title: payload.title || 'Notifikasi',
  body: payload.message || payload.msg || 'Ada pembaruan baru.',
  url: payload.url || '/',
  icon: payload.icon || '/logo192.png',
  badge: payload.badge || '/logo192.png'
 })

 const entries = Array.from(subscriptions.entries())
 let sent = 0
 let failed = 0

 await Promise.allSettled(
  entries.map(async ([endpoint, subscription]) => {
   try {
    await webpush.sendNotification(subscription, message)
    sent += 1
   } catch (error) {
    failed += 1
    const statusCode = error?.statusCode
    if (statusCode === 404 || statusCode === 410) {
     subscriptions.delete(endpoint)
    }
   }
  })
 )

 return { sent, failed }
}

