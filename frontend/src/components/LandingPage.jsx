const FAN_PATHS = [
  "M 0 150 L 80 147.6 L 160 105.2 L 240 79.1 L 320 49.6 L 400 53.4 L 480 53.4",
  "M 0 150 L 80 167.0 L 160 131.6 L 240 118.1 L 320 79.0 L 400 52.2 L 480 44.1",
  "M 0 150 L 80 113.7 L 160 88.6 L 240 92.9 L 320 90.3 L 400 66.6 L 480 66.9",
  "M 0 150 L 80 180.2 L 160 170.1 L 240 144.1 L 320 118.4 L 400 141.5 L 480 148.7",
  "M 0 150 L 80 173.5 L 160 191.9 L 240 197.8 L 320 232.0 L 400 227.6 L 480 234.5",
  "M 0 150 L 80 177.9 L 160 192.1 L 240 222.1 L 320 233.7 L 400 253.5 L 480 230.4",
]
const MEDIAN_PATH =
  "M 0 150 L 80 167.6 L 160 133.0 L 240 150.4 L 320 160.8 L 400 147.9 L 480 123.0"

function MonteCarloFan() {
  return (
    <svg
      viewBox="0 0 480 280"
      className="w-full h-auto max-w-xl mx-auto"
      role="img"
      aria-label="Fan of simulated portfolio outcomes converging from a single starting point"
    >
      {FAN_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#7c3aed"
          strokeOpacity={0.18}
          strokeWidth="2"
        />
      ))}
      <path
        d={MEDIAN_PATH}
        fill="none"
        stroke="#c084fc"
        strokeWidth="3"
        strokeLinecap="round"
        className="motion-safe:animate-[draw_1.8s_ease-out_forwards]"
        style={{
          strokeDasharray: 700,
          strokeDashoffset: 700,
        }}
      />
      <circle cx="0" cy="150" r="5" fill="#c084fc" />
      <style>{`
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  )
}

const FEATURES = [
  {
    title: "Live portfolio tracking",
    desc: "Search any company, add real holdings, and see live prices pulled straight from the market.",
  },
  {
    title: "Real risk metrics",
    desc: "Value at Risk, Sharpe Ratio, and volatility — the same numbers professional risk desks use.",
  },
  {
    title: "Monte Carlo simulation",
    desc: "1,000 simulated futures show the realistic range of outcomes, not a single guess.",
  },
  {
    title: "Correlation insights",
    desc: "See which holdings actually diversify your risk, and which move together in a crisis.",
  },
]

export function LandingPage({ onEnter }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-8 pt-20 pb-16">
        <p className="text-purple-400 text-sm font-semibold tracking-wide uppercase mb-4">
          Portfolio Risk Analytics
        </p>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          EventLens AI 🚀
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Every portfolio has a range of possible futures. EventLens AI runs a thousand
          of them, so you can see the risk before it finds you.
        </p>

        <MonteCarloFan />

        <button
          onClick={onEnter}
          className="mt-10 bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-semibold text-lg"
        >
          Enter Dashboard →
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-800 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}