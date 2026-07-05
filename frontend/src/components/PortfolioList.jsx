import { useState } from 'react'
import { PriceHistoryModal } from './PriceHistoryModal'

export function PortfolioList({ holdings, loading, error, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [historyTicker, setHistoryTicker] = useState(null)

  if (loading) return <p className="text-gray-400">Loading portfolio...</p>
  if (error) return <p className="text-red-400">Error: {error}</p>

  if (holdings.length === 0) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
        <p className="text-lg font-semibold mb-1">No holdings yet</p>
        <p className="text-sm">Search for a stock above and add your first holding to get started.</p>
      </div>
    )
  }

  const startEdit = (h) => {
    setEditingId(h.id)
    setEditValue(h.shares.toString())
  }

  const saveEdit = (id) => {
    const newShares = parseInt(editValue)
    if (newShares > 0) {
      onUpdate(id, newShares)
    }
    setEditingId(null)
  }

  return (
    <>
      <div className="space-y-3">
        {holdings.map((h) => (
          <div key={h.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
            <span
              className="font-semibold cursor-pointer hover:text-purple-400"
              onClick={() => setHistoryTicker(h.ticker)}
              title="Click to view price history"
            >
              {h.ticker}
            </span>

            {editingId === h.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(h.id)}
                  autoFocus
                  className="bg-gray-700 px-2 py-1 rounded w-20 outline-none"
                />
                <button
                  onClick={() => saveEdit(h.id)}
                  className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : h.price !== null ? (
              <span
                onClick={() => startEdit(h)}
                className="cursor-pointer hover:text-purple-400"
                title="Click to edit shares"
              >
                {h.shares} shares @ ${h.price} = ${h.value.toLocaleString()}
              </span>
            ) : (
              <span className="text-yellow-400 text-sm">Price temporarily unavailable</span>
            )}

            <button
              onClick={() => onDelete(h.id)}
              className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm ml-4"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {historyTicker && (
        <PriceHistoryModal ticker={historyTicker} onClose={() => setHistoryTicker(null)} />
      )}
    </>
  )
}