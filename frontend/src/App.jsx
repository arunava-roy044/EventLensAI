import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newTicker, setNewTicker] = useState('')
  const [newShares, setNewShares] = useState('')
  const [formError, setFormError] = useState(null)

  const fetchPortfolio = () => {
    setLoading(true)
    axios.get(`${API_URL}/portfolio`)
      .then((response) => {
        setHoldings(response.data.holdings)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const handleAddHolding = (e) => {
    e.preventDefault()
    setFormError(null)

    if (!newTicker || !newShares) {
      setFormError('Enter both a ticker and share count')
      return
    }

    axios.post(`${API_URL}/portfolio`, {
      ticker: newTicker,
      shares: parseInt(newShares),
    })
      .then((response) => {
        if (response.data.error) {
          setFormError(response.data.error)
        } else {
          setNewTicker('')
          setNewShares('')
          fetchPortfolio()
        }
      })
      .catch((err) => setFormError(err.message))
  }

  const handleDelete = (id) => {
    axios.delete(`${API_URL}/portfolio/${id}`)
      .then(() => fetchPortfolio())
      .catch((err) => setError(err.message))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-purple-400 mb-6">
        EventLens AI 🚀
      </h1>

      <form onSubmit={handleAddHolding} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Ticker (e.g. MSFT)"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded-lg outline-none"
        />
        <input
          type="number"
          placeholder="Shares"
          value={newShares}
          onChange={(e) => setNewShares(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded-lg outline-none w-28"
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-semibold"
        >
          Add Holding
        </button>
      </form>

      {formError && <p className="text-red-400 mb-4">{formError}</p>}
      {loading && <p>Loading portfolio...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {holdings.map((h) => (
            <div key={h.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
              <span className="font-semibold">{h.ticker}</span>
              <span>{h.shares} shares @ ${h.price} = ${h.value.toLocaleString()}</span>
              <button
                onClick={() => handleDelete(h.id)}
                className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm ml-4"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App