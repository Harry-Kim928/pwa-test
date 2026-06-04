import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function formatPhone(input: string) {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function toE164(formatted: string) {
  const d = formatted.replace(/\D/g, '')
  return `+82${d.replace(/^0/, '')}`
}

export default function LoginPage() {
  const { sendOtp, verifyOtp, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/'

  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (session) navigate(from, { replace: true })
  }, [session, from, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const phoneDigits = phone.replace(/\D/g, '')
  const phoneValid = phoneDigits.length === 11 && phoneDigits.startsWith('010')

  const onSendOtp = async () => {
    if (!phoneValid || busy) return
    setError(null)
    setBusy(true)
    const { error } = await sendOtp(toE164(phone))
    setBusy(false)
    if (error) {
      setError(error)
      return
    }
    setStep('code')
    setCode('')
    setCooldown(60)
  }

  const onVerify = async () => {
    if (code.length !== 6 || busy) return
    setError(null)
    setBusy(true)
    const { error } = await verifyOtp(toE164(phone), code)
    setBusy(false)
    if (error) setError(error)
  }

  return (
    <div className="min-h-full flex flex-col bg-white">
      <div className="flex-1 px-6 pt-16">
        <div className="flex justify-center mb-10">
          <svg viewBox="0 0 100 100" className="w-20 h-20" aria-hidden>
            <circle cx="49" cy="49" r="36" fill="#000" />
            <circle cx="49" cy="49" r="13" fill="#fff" />
            <circle cx="74" cy="74" r="13" fill="#FF6B1A" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900">콴다과외 튜터</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          {step === 'phone'
            ? '등록하신 휴대폰 번호로 로그인해주세요.'
            : '문자로 받은 6자리 인증번호를 입력해주세요.'}
        </p>

        {step === 'phone' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSendOtp()
            }}
            className="mt-8"
          >
            <label className="block text-xs text-gray-500 mb-2">휴대폰 번호</label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-1234-5678"
              className="w-full bg-transparent border-b-2 border-qanda-orange py-2 text-base text-gray-900 outline-none placeholder:text-gray-300"
              enterKeyHint="send"
            />
            <button
              type="submit"
              disabled={!phoneValid || busy}
              className="mt-8 w-full rounded-md bg-qanda-orange text-white py-3 text-sm font-semibold disabled:opacity-40"
            >
              {busy ? '전송 중...' : '인증번호 받기'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onVerify()
            }}
            className="mt-8"
          >
            <div className="text-xs text-gray-500">{phone}</div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6자리 인증번호"
              className="mt-3 w-full bg-transparent border-b-2 border-qanda-orange py-2 text-base text-gray-900 tracking-[0.4em] outline-none placeholder:text-gray-300 placeholder:tracking-normal"
              enterKeyHint="done"
              autoFocus
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={cooldown > 0 || busy}
                onClick={onSendOtp}
                className="text-xs text-gray-500 disabled:text-gray-300"
              >
                {cooldown > 0 ? `다시 받기 (${cooldown}s)` : '다시 받기'}
              </button>
            </div>
            <button
              type="submit"
              disabled={code.length !== 6 || busy}
              className="mt-8 w-full rounded-md bg-qanda-orange text-white py-3 text-sm font-semibold disabled:opacity-40"
            >
              {busy ? '확인 중...' : '확인'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError(null)
              }}
              className="mt-3 w-full text-center text-xs text-gray-500 py-2"
            >
              번호 다시 입력
            </button>
          </form>
        )}

        {error && <div className="mt-4 text-xs text-rose-600">{error}</div>}
      </div>
    </div>
  )
}
