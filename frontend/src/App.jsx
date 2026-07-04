import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedTicker, setSelectedTicker] = useState('')
  const [newShares, setNewShares] = useState('')
  const [formError, setFormError] = useState(null)

  const fetchPortfolio = () => {
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
    const interval = setInterval(fetchPortfolio, 60000) // auto-refresh every 15s
    return () => clearInterval(interval)
  }, [])

  // Search as the user types, with a small debounce
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(() => {
      axios.get(`${API_URL}/search`, { params: { q: searchQuery } })
        .then((response) => setSearchResults(response.data.results))
        .catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleAddHolding = (e) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedTicker || !newShares) {
      setFormError('Search and select a stock, then enter shares')
      return
    }

    axios.post(`${API_URL}/portfolio`, {
      ticker: selectedTicker,
      shares: parseInt(newShares),
    })
      .then((response) => {
        if (response.data.error) {
          setFormError(response.data.error)
        } else {
          setSearchQuery('')
          setSelectedTicker('')
          setNewShares('')
          setSearchResults([])
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

      <form onSubmit={handleAddHolding} className="mb-6">
        <div className="flex gap-3 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search company (e.g. Tesla)"
              value={selectedTicker ? `${selectedTicker}` : searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedTicker('')
              }}
              className="bg-gray-800 px-3 py-2 rounded-lg outline-none w-64"
            />
            {searchResults.length > 0 && !selectedTicker && (
              <div className="absolute top-full mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg z-10 max-h-60 overflow-y-auto">
                {searchResults.map((r) => (
                  <div
                    key={r.symbol}
                    onClick={() => {
                      setSelectedTicker(r.symbol)
                      setSearchResults([])
                    }}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-left"
                  >
                    <span className="font-semibold">{r.symbol}</span>
                    <span className="text-gray-400 text-sm ml-2">{r.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        </div>
      </form>

      {formError && <p className="text-red-400 mb-4">{formError}</p>}
      {loading && <p>Loading portfolio...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {!loading && !error && (
  <div className="space-y-3">
    {holdings.map((h) => (
      <div key={h.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
        <span className="font-semibold">{h.ticker}</span>
        {h.price !== null ? (
          <span>{h.shares} shares @ ${h.price} = ${h.value.toLocaleString()}</span>
        ) : (
          <span className="text-yellow-400 text-sm">Price temporarily unavailable</span>
        )}
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