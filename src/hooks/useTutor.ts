import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type Tutor = {
  user_id: number
  phone: string | null
  name: string
  university: string | null
  major: string | null
  track: string | null
  academic_status: string | null
  available_subjects: string | null
  confident_subjects: string | null
  tutor_status: string
  tutor_rank: string | null
  total_students: number | null
}

const TUTOR_COLUMNS =
  'user_id, phone, name, university, major, track, academic_status, available_subjects, confident_subjects, tutor_status, tutor_rank, total_students'

export function useTutor() {
  const { session } = useAuth()
  const phone = session?.user?.phone ?? null

  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!phone) {
      setTutor(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    supabase
      .from('tutors')
      .select(TUTOR_COLUMNS)
      .eq('phone', phone)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
          setTutor(null)
        } else {
          setTutor(data as Tutor | null)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [phone])

  return { tutor, loading, error }
}
