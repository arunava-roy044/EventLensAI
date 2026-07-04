import { useState, useEffect } from 'react'
import { getRisk } from '../api/client'

export function useRisk() {
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRisk()
      .then((response) => {
        setRisk(response.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { risk, loading }
}