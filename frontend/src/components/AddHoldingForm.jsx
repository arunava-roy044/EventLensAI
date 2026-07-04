import { useState, useEffect } from 'react'
import { searchTickers, addHolding } from '../api/client'

export function AddHoldingForm({ onHoldingAdded }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedTicker, setSelectedTicker] = useState('')
  const [shares, setShares] = useState('')
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(() => {
      searchTickers(searchQuery)
        .then((response) => setSearchResults(response.data.results))
        .catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedTicker || !shares) {
      setFormError('Search and select a stock, then enter shares')
      return
    }

    addHolding(selectedTicker, parseInt(shares))
      .then((response) => {
        if (response.data.error) {
          setFormError(response.data.error)
        } else {
          setSearchQuery('')
          setSelectedTicker('')
          setShares('')
          setSearchResults([])
          onHoldingAdded()
        }
      })
      .catch((err) => setFormError(err.message))
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-3 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search company (e.g. Tesla)"
            value={selectedTicker || searchQuery}
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
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded-lg outline-none w-28"
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-semibold"
        >
          Add Holding
        </button>
      </div>
      {formError && <p className="text-red-400 mt-2">{formError}</p>}
    </form>
  )
}