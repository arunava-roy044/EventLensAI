import { useState, useEffect, useCallback } from 'react'
import { getPortfolio, deleteHolding as apiDeleteHolding } from '../api/client'

export function usePortfolio(pollInterval = 60000) {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPortfolio = useCallback(() => {
    getPortfolio()
      .then((response) => {
        setHoldings(response.data.holdings)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchPortfolio()
    const interval = setInterval(fetchPortfolio, pollInterval)
    return () => clearInterval(interval)
  }, [fetchPortfolio, pollInterval])

  const deleteHolding = (id) => {
    apiDeleteHolding(id).then(() => fetchPortfolio())
  }

  return { holdings, loading, error, refetch: fetchPortfolio, deleteHolding }
}