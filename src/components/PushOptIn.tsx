import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPushStatus, subscribePush, unsubscribePush, type PushStatus } from '../lib/push'

export default function PushOptIn() {
  const { session } = useAuth()
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getPushStatus().then(setStatus)
  }, [])

  if (!session || status === null || status === 'unsupported') return null

  const onSubscribe = async () => {
    setBusy(true)
    const next = await subscribePush(session)
    setStatus(next)
    setBusy(false)
  }

  const onUnsubscribe = async () => {
    setBusy(true)
    await unsubscribePush(session)
    setStatus('permission-default')
    setBusy(false)
  }

  if (status === 'ios-needs-pwa-install') {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900">
        iOS에서 알림을 받으려면 Safari에서{' '}
        <span className="font-semibold">공유 → 홈 화면에 추가</span> 후 사용해주세요.
      </div>
    )
  }
  if (status === 'permission-denied') {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-[12px] text-gray-600">
        브라우저 설정에서 알림을 차단했어요. 설정 → 알림에서 허용으로 바꿔주세요.
      </div>
    )
  }
  if (status === 'subscribed') {
    return (
      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
        <span className="text-[12px] text-gray-700">알림이 켜져 있어요</span>
        <button
          type="button"
          onClick={onUnsubscribe}
          disabled={busy}
          className="text-[12px] text-gray-500 underline underline-offset-2 disabled:opacity-40"
        >
          끄기
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onSubscribe}
      disabled={busy}
      className="w-full rounded-lg border-2 border-qanda-orange text-qanda-orange text-[13px] font-semibold py-2.5 active:bg-orange-50 disabled:opacity-40"
    >
      {busy ? '설정 중...' : '알림 받기'}
    </button>
  )
}
