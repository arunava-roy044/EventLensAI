import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, AlertTriangle, Activity } from 'lucide-react'
import { TabHeader } from './TabHeader'

export function RiskDashboard({ risk, loading }) {
  if (loading) return <p className="mt-6 text-gray-400">Calculating risk metrics...</p>

  if (!risk) return null

  if (risk.error) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
        <p>Add at least one holding to see risk analysis.</p>
      </div>
    )
  }

  return (
    <div>
      <TabHeader
        icon={TrendingUp}
        title="Risk Analysis"
        description="Quantitative risk metrics computed from your portfolio's real historical volatility."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <DollarSign size={14} /> Portfolio Value
          </div>
          <p className="text-xl font-bold">${risk.portfolio_value.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <AlertTriangle size={14} /> Value at Risk (95%, daily)
          </div>
          <p className="text-xl font-bold text-red-400">{risk.risk_metrics.var_95_daily_pct}%</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Activity size={14} /> Sharpe Ratio
          </div>
          <p className="text-xl font-bold text-green-400">{risk.risk_metrics.sharpe_ratio}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <TrendingUp size={14} /> Annualized Volatility
          </div>
          <p className="text-xl font-bold">{risk.risk_metrics.annualized_volatility_pct}%</p>
        </div>
      </div>

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
  )
}