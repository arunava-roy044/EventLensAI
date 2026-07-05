import { useState, useEffect } from 'react'
import { getCorrelation } from '../api/client'

function getColor(value) {
  // -1 (green) -> 0 (gray) -> 1 (red)
  if (value === 1) return '#374151' // diagonal (self-correlation), neutral
  if (value > 0) {
    const intensity = Math.round(value * 200)
    return `rgb(${100 + intensity}, ${80}, ${80})`
  } else {
    const intensity = Math.round(Math.abs(value) * 200)
    return `rgb(${80}, ${100 + intensity}, ${80})`
  }
}

export function CorrelationHeatmap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCorrelation()
      .then((response) => {
        setData(response.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="mt-6 text-gray-400">Calculating correlations...</p>
  if (!data || data.error) return null

  const { tickers, matrix } = data

  return (
    <div className="bg-gray-800 p-6 rounded-lg mt-6 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-1">Correlation Matrix</h3>
      <p className="text-gray-400 text-sm mb-4">
        Green = moves oppositely (good diversification) · Red = moves together (concentration risk)
      </p>
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-2"></th>
            {tickers.map((t) => (
              <th key={t} className="p-2 text-sm text-gray-300">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.ticker}>
              <td className="p-2 text-sm text-gray-300 font-semibold">{row.ticker}</td>
              {tickers.map((t) => (
                <td
                  key={t}
                  className="p-2 text-center text-sm text-white"
                  style={{ backgroundColor: getColor(row[t]) }}
                >
                  {row[t]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}