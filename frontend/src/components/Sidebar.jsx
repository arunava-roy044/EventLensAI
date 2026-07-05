const NAV_ITEMS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "allocation", label: "Allocation" },
  { id: "risk", label: "Risk Analysis" },
  { id: "correlation", label: "Correlation" },
]

export function Sidebar({ onBackToLanding, activeTab, onTabChange }) {
  return (
    <div className="w-56 shrink-0 bg-gray-800 min-h-screen p-4 sticky top-0 self-start flex flex-col">
      <button
        onClick={onBackToLanding}
        className="text-purple-400 font-bold text-lg mb-8 text-left hover:text-purple-300"
      >
        EventLens AI 🚀
      </button>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === item.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}