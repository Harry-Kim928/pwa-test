import { supabase } from './supabase'
import { detectPlatform, getDeviceId, isPWAInstalled } from './deviceTracking'
import type { Session } from '@supabase/supabase-js'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export type PushStatus =
  | 'unsupported'
  | 'ios-needs-pwa-install'
  | 'permission-denied'
  | 'permission-default'
  | 'subscribed'
  | 'error'

export async function getPushStatus(): Promise<PushStatus> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (detectPlatform() === 'ios' && !isPWAInstalled()) return 'ios-needs-pwa-install'
    return 'unsupported'
  }
  if (Notification.permission === 'denied') return 'permission-denied'
  if (Notification.permission === 'default') return 'permission-default'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'subscribed' : 'permission-default'
}

export async function subscribePush(session: Session): Promise<PushStatus> {
  if (!VAPID_PUBLIC_KEY) {
    console.error('VITE_VAPID_PUBLIC_KEY 미설정')
    return 'error'
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (detectPlatform() === 'ios' && !isPWAInstalled()) return 'ios-needs-pwa-install'
    return 'unsupported'
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return permission === 'denied' ? 'permission-denied' : 'permission-default'
  }

  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      })
    }

    const { error } = await supabase
      .from('devices')
      .update({ push_subscription: sub.toJSON() })
      .eq('user_id', session.user.id)
      .eq('device_id', getDeviceId())

    if (error) {
      console.error('[push] subscription save failed:', error.message)
      return 'error'
    }
    return 'subscribed'
  } catch (err) {
    console.error('[push] subscribe failed:', err)
    return 'error'
  }
}

export async function unsubscribePush(session: Session): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
  await supabase
    .from('devices')
    .update({ push_subscription: null })
    .eq('user_id', session.user.id)
    .eq('device_id', getDeviceId())
}
