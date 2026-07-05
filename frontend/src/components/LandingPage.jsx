import { useState, useEffect, useRef } from 'react'

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
        <path key={i} d={d} fill="none" stroke="#7c3aed" strokeOpacity={0.18} strokeWidth="2" />
      ))}
      <path
        d={MEDIAN_PATH}
        fill="none"
        stroke="#c084fc"
        strokeWidth="3"
        strokeLinecap="round"
        className="motion-safe:animate-[draw_1.8s_ease-out_forwards]"
        style={{ strokeDasharray: 700, strokeDashoffset: 700 }}
      />
      <circle cx="0" cy="150" r="5" fill="#c084fc" />
      <style>{`
        @keyframes draw { to { stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  )
}

// Fades a section in once it scrolls into view
function Reveal({ children, className = "" }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
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

const STEPS = [
  {
    num: "01",
    title: "Add your holdings",
    desc: "Search by company name — EventLens finds the ticker and pulls the live price automatically.",
  },
  {
    num: "02",
    title: "We calculate the risk",
    desc: "VaR, Sharpe Ratio, volatility, and 1,000 Monte Carlo simulations run against your actual holdings.",
  },
  {
    num: "03",
    title: "See it, not just read it",
    desc: "Allocation, correlation, and projected outcomes rendered as charts you can actually reason about.",
  },
]

const TECH_STACK = ["React", "Tailwind CSS", "FastAPI", "PostgreSQL", "SQLAlchemy", "yfinance", "Recharts"]

// Interactive VaR demo — no backend needed, just shows the concept
function VarCalculator() {
  const [portfolioValue, setPortfolioValue] = useState(50000)
  const [varPct, setVarPct] = useState(2.5)

  const dollarLoss = (portfolioValue * varPct) / 100

  return (
    <div className="bg-gray-800 rounded-lg p-6 md:p-8">
      <h3 className="text-lg font-semibold mb-1">Try it: what does VaR actually mean?</h3>
      <p className="text-gray-400 text-sm mb-6">
        Drag the sliders to see how Value at Risk translates into real dollars.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm text-gray-400 block mb-2">
            Portfolio value: <span className="text-white font-semibold">${portfolioValue.toLocaleString()}</span>
          </label>
          <input
            type="range"
            min="5000"
            max="500000"
            step="5000"
            value={portfolioValue}
            onChange={(e) => setPortfolioValue(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">
            Daily VaR (95%): <span className="text-white font-semibold">{varPct.toFixed(1)}%</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="8"
            step="0.1"
            value={varPct}
            onChange={(e) => setVarPct(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm mb-1">On a bad day (1 in 20), you could lose</p>
        <p className="text-3xl font-bold text-red-400">
          ${dollarLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  )
}

export function LandingPage({ onEnter }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero */}
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

      {/* Feature cards */}
      <Reveal className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-800 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* How it works */}
      <Reveal className="max-w-5xl mx-auto px-8 pb-24">
        <h2 className="text-2xl font-bold mb-8">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.num}>
              <p className="text-purple-400 font-mono text-sm mb-2">{s.num}</p>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Interactive VaR demo */}
      <Reveal className="max-w-3xl mx-auto px-8 pb-24">
        <VarCalculator />
      </Reveal>

      {/* Tech stack */}
      <Reveal className="max-w-5xl mx-auto px-8 pb-24">
        <p className="text-gray-500 text-sm uppercase tracking-wide mb-4">Built with</p>
        <div className="flex flex-wrap gap-3">
          {TECH_STACK.map((t) => (
            <span key={t} className="bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </Reveal>
    </div>
  )
}