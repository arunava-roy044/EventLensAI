export function PortfolioList({ holdings, loading, error, onDelete }) {
  if (loading) return <p>Loading portfolio...</p>
  if (error) return <p className="text-red-400">Error: {error}</p>

  return (
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
            onClick={() => onDelete(h.id)}
            className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm ml-4"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}