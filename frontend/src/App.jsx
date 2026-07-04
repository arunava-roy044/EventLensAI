import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

  const [risk, setRisk] = useState(null)
  const [riskLoading, setRiskLoading] = useState(true)

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

  const fetchRisk = () => {
  setRiskLoading(true)
  axios.get(`${API_URL}/portfolio/risk`)
    .then((response) => {
      setRisk(response.data)
      setRiskLoading(false)
    })
    .catch(() => setRiskLoading(false))
  }

  useEffect(() => {
    fetchRisk()
  }, [])

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

  {risk && !risk.error && (
  <div className="mt-10">
    <h2 className="text-2xl font-bold text-purple-400 mb-4">Risk Analysis</h2>

    {/* Metric cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Portfolio Value</p>
        <p className="text-xl font-bold">${risk.portfolio_value.toLocaleString()}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Value at Risk (95%, daily)</p>
        <p className="text-xl font-bold text-red-400">{risk.risk_metrics.var_95_daily_pct}%</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Sharpe Ratio</p>
        <p className="text-xl font-bold text-green-400">{risk.risk_metrics.sharpe_ratio}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Annualized Volatility</p>
        <p className="text-xl font-bold">{risk.risk_metrics.annualized_volatility_pct}%</p>
      </div>
    </div>

    {/* Monte Carlo chart */}
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-1">
        30-Day Monte Carlo Projection ({risk.monte_carlo.simulations_run.toLocaleString()} simulations)
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Range of likely portfolio outcomes based on historical volatility
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={[
            { name: 'Worst Case (5%)', value: risk.monte_carlo.worst_case_5pct },
            { name: 'Median Case', value: risk.monte_carlo.median_case },
            { name: 'Best Case (95%)', value: risk.monte_carlo.best_case_95pct },
          ]}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            formatter={(value) => [`$${value.toLocaleString()}`, 'Projected Value']}
          />
          <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

{riskLoading && <p className="mt-6 text-gray-400">Calculating risk metrics...</p>}
    </div>
  )
}

export default App