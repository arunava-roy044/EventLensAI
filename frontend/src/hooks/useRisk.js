import { useState, useEffect, useCallback } from 'react'
import { getRisk } from '../api/client'

export function useRisk() {
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRisk = useCallback(() => {
    setLoading(true)
    getRisk()
      .then((response) => {
        setRisk(response.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRisk()
  }, [fetchRisk])

  return { risk, loading, refetchRisk: fetchRisk }
}