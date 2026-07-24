import { LayoutDashboard, Wallet, PieChart, TrendingUp, Grid3x3, Zap } from 'lucide-react'

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "portfolio", label: "Portfolio", icon: Wallet },
  { id: "allocation", label: "Allocation", icon: PieChart },
  { id: "risk", label: "Risk Analysis", icon: TrendingUp },
  { id: "correlation", label: "Correlation", icon: Grid3x3 },
  { id: "event-impact", label: "Event Impact", icon: Zap },
]

export function Sidebar({ onBackToLanding, activeTab, onTabChange, holdings }) {
  const validHoldings = holdings.filter((h) => h.value !== null)
  const totalValue = validHoldings.reduce((sum, h) => sum + h.value, 0)

  return (
    <div className="w-64 shrink-0 bg-gray-800 h-screen sticky top-0 flex flex-col">
      <div className="p-4">
        <button
          onClick={onBackToLanding}
          className="text-purple-400 font-bold text-lg mb-8 text-left hover:text-purple-300"
        >
          EventLens AI 🚀
        </button>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Portfolio Value</p>
        <p className="text-xl font-bold mb-2">
          ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="text-gray-500 text-xs">
          {validHoldings.length} {validHoldings.length === 1 ? 'holding' : 'holdings'}
        </p>
      </div>
    </div>
  )
}