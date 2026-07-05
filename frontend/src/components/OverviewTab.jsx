import { TrendingUp, TrendingDown } from 'lucide-react'

export function OverviewTab({ holdings, risk }) {
  const validHoldings = holdings.filter((h) => h.value !== null)

  if (validHoldings.length === 0) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
        <p className="text-lg font-semibold mb-1">Nothing to show yet</p>
        <p className="text-sm">Add a holding in the Portfolio tab to see your overview.</p>
      </div>
    )
  }

  const totalValue = validHoldings.reduce((sum, h) => sum + h.value, 0)
  const weightedChange = validHoldings.reduce(
    (sum, h) => sum + (h.change_pct || 0) * (h.value / totalValue),
    0
  )

  const best = [...validHoldings].sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0))[0]
  const worst = [...validHoldings].sort((a, b) => (a.change_pct || 0) - (b.change_pct || 0))[0]

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="text-xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Today's Change</p>
          <p className={`text-xl font-bold flex items-center gap-1 ${weightedChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weightedChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {weightedChange.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Holdings</p>
          <p className="text-xl font-bold">{validHoldings.length}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Sharpe Ratio</p>
          <p className="text-xl font-bold">
            {risk && !risk.error ? risk.risk_metrics.sharpe_ratio : '—'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-5 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Best performer today</p>
          <p className="text-lg font-bold flex items-center gap-2">
            {best.ticker}
            <span className="text-green-400 text-sm flex items-center gap-1">
              <TrendingUp size={14} /> {best.change_pct}%
            </span>
          </p>
        </div>
        <div className="bg-gray-800 p-5 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Worst performer today</p>
          <p className="text-lg font-bold flex items-center gap-2">
            {worst.ticker}
            <span className="text-red-400 text-sm flex items-center gap-1">
              <TrendingDown size={14} /> {worst.change_pct}%
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}