import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/portfolio')
      .then((response) => {
        setHoldings(response.data.holdings)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-purple-400 mb-6">
        EventLens AI 🚀
      </h1>

      {loading && <p>Loading portfolio...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {holdings.map((h) => (
            <div key={h.ticker} className="bg-gray-800 p-4 rounded-lg flex justify-between">
              <span className="font-semibold">{h.ticker}</span>
              <span>{h.shares} shares — ${h.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App