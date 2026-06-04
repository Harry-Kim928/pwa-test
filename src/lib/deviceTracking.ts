import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

const DEVICE_ID_KEY = 'qanda-tutor-device-id'
const APP_VERSION = '0.1.0'
const HEARTBEAT_MS = 30_000

export type Platform = 'ios' | 'android' | 'desktop' | 'other'

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Macintosh|Windows|Linux/.test(ua)) return 'desktop'
  return 'other'
}

export function isPWAInstalled(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

async function upsertDevice(session: Session) {
  const deviceId = getOrCreateDeviceId()
  const phone = session.user.phone ?? null

  const { error } = await supabase.from('devices').upsert(
    {
      user_id: session.user.id,
      phone,
      device_id: deviceId,
      platform: detectPlatform(),
      user_agent: navigator.userAgent,
      is_pwa: isPWAInstalled(),
      app_version: APP_VERSION,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,device_id' },
  )

  if (error) {
    console.warn('[deviceTracking] upsert failed:', error.message)
  }
}

let heartbeatTimer: number | null = null
let visibilityHandler: (() => void) | null = null

export function startDeviceTracking(session: Session) {
  stopDeviceTracking()
  void upsertDevice(session)

  heartbeatTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void upsertDevice(session)
    }
  }, HEARTBEAT_MS)

  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      void upsertDevice(session)
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

export function stopDeviceTracking() {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
}

export function getDeviceId() {
  return getOrCreateDeviceId()
}
