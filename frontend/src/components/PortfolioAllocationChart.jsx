import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#ec4899', '#14b8a6', '#f97316']

export function PortfolioAllocationChart({ holdings }) {
  const validHoldings = holdings.filter((h) => h.value !== null)

  if (validHoldings.length === 0) return null

  const data = validHoldings.map((h) => ({
    name: h.ticker,
    value: h.value,
  }))

  const totalValue = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-gray-800 p-6 rounded-lg mt-6">
      <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, value }) => `${name} ${((value / totalValue) * 100).toFixed(1)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}