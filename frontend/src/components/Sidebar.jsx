const NAV_ITEMS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "allocation", label: "Allocation" },
  { id: "risk", label: "Risk Analysis" },
  { id: "correlation", label: "Correlation" },
]

export function Sidebar({ onBackToLanding }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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
            onClick={() => scrollTo(item.id)}
            className="text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white text-sm font-medium"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}