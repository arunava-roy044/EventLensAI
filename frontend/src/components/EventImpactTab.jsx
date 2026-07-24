import { useState, useEffect } from 'react'
import { Zap, TrendingUp, TrendingDown, AlertTriangle, Clock, Search } from 'lucide-react'
import { searchTickers, predictEventImpact, getEventHistory } from '../api/client'
import { TabHeader } from './TabHeader'

const SENTIMENT_OPTIONS = [
  { value: 'very_negative', label: 'Very Negative', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  { value: 'negative', label: 'Negative', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
  { value: 'neutral', label: 'Neutral', color: 'text-gray-300', bg: 'bg-gray-500/10 border-gray-500/30' },
  { value: 'positive', label: 'Positive', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  { value: 'very_positive', label: 'Very Positive', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
]

function formatSentiment(label) {
  return label
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function EventImpactTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedTicker, setSelectedTicker] = useState('')
  const [sentiment, setSentiment] = useState('neutral')
  const [isEarnings, setIsEarnings] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // Fetch prediction history on mount
  useEffect(() => {
    getEventHistory()
      .then((res) => {
        setHistory(res.data.history)
        setHistoryLoading(false)
      })
      .catch(() => setHistoryLoading(false))
  }, [])

  // Debounced ticker search
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(() => {
      searchTickers(searchQuery)
        .then((res) => setSearchResults(res.data.results))
        .catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!selectedTicker) {
      setError('Search and select a stock ticker first')
      return
    }

    setLoading(true)
    predictEventImpact({
      ticker: selectedTicker,
      sentiment_label: sentiment,
      is_earnings_related: isEarnings,
    })
      .then((res) => {
        if (res.data.error) {
          setError(res.data.error)
        } else {
          setResult(res.data)
          // Refresh history
          getEventHistory()
            .then((h) => setHistory(h.data.history))
            .catch(() => {})
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  const selectedSentimentOption = SENTIMENT_OPTIONS.find((s) => s.value === sentiment)

  return (
    <div>
      <TabHeader
        icon={Zap}
        title="Event Impact Analysis"
        description="Estimate how a market event might affect a stock's short-term abnormal return, using an ML model trained on 258 GDELT-derived event-days."
      />

      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Ticker search */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Stock Ticker</label>
            <div className="relative">
              <div className="flex items-center bg-gray-700 rounded-lg">
                <Search size={16} className="ml-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search company (e.g. Apple)"
                  value={selectedTicker || searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedTicker('')
                  }}
                  className="bg-transparent px-3 py-2.5 outline-none w-full"
                />
              </div>
              {searchResults.length > 0 && !selectedTicker && (
                <div className="absolute top-full mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg z-10 max-h-48 overflow-y-auto">
                  {searchResults.map((r) => (
                    <div
                      key={r.symbol}
                      onClick={() => {
                        setSelectedTicker(r.symbol)
                        setSearchResults([])
                      }}
                      className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-left"
                    >
                      <span className="font-semibold">{r.symbol}</span>
                      <span className="text-gray-400 text-sm ml-2">{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sentiment dropdown */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Event Sentiment</label>
            <div className="grid grid-cols-5 gap-1.5">
              {SENTIMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSentiment(opt.value)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                    sentiment === opt.value
                      ? `${opt.bg} ${opt.color} border-current`
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Earnings toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsEarnings(!isEarnings)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                isEarnings ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                  isEarnings ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-gray-300">Earnings-related event</span>
          </label>

          <button
            type="submit"
            disabled={loading || !selectedTicker}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              loading || !selectedTicker
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              'Analyze Impact'
            )}
          </button>
        </div>

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </form>

      {/* Result card */}
      {result && (
        <div className="bg-gray-800 p-6 rounded-lg mb-6 motion-safe:animate-[fadeSlide_0.35s_ease-out]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="text-purple-400">{result.inputs_used.sector}</span>
                <span className="text-gray-500">·</span>
                {selectedTicker}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Sentiment: {formatSentiment(sentiment)} · {isEarnings ? 'Earnings-related' : 'Non-earnings'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-1">Predicted 3-Day CAR</p>
              <p
                className={`text-3xl font-bold flex items-center gap-1 justify-end ${
                  result.predicted_car_3day >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {result.predicted_car_3day >= 0 ? (
                  <TrendingUp size={24} />
                ) : (
                  <TrendingDown size={24} />
                )}
                {result.predicted_car_3day >= 0 ? '+' : ''}
                {result.predicted_car_3day.toFixed(3)}%
              </p>
            </div>
          </div>

          {/* Inputs used (transparency) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Avg Tone', value: result.inputs_used.avg_tone.toFixed(2) },
              { label: 'Volatility', value: `${(result.inputs_used.pre_event_volatility * 100).toFixed(1)}%` },
              { label: 'Beta', value: result.inputs_used.beta.toFixed(3) },
              { label: 'Sector', value: result.inputs_used.sector },
            ].map((item) => (
              <div key={item.label} className="bg-gray-900 p-3 rounded-lg">
                <p className="text-gray-500 text-xs">{item.label}</p>
                <p className="font-medium text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Honest disclaimer */}
          <div className="flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">{result.disclaimer}</p>
          </div>
        </div>
      )}

      {/* Prediction history */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          Recent Predictions
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Your last 20 event-impact analyses, most recent first.
        </p>

        {historyLoading && <p className="text-gray-400 text-sm">Loading history...</p>}

        {!historyLoading && history.length === 0 && (
          <p className="text-gray-500 text-sm">No predictions yet. Run your first analysis above.</p>
        )}

        {!historyLoading && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-700">
                  <th className="pb-2 pr-4">Ticker</th>
                  <th className="pb-2 pr-4">Sentiment</th>
                  <th className="pb-2 pr-4">Earnings</th>
                  <th className="pb-2 pr-4">Sector</th>
                  <th className="pb-2 pr-4 text-right">Predicted CAR</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2.5 pr-4 font-semibold">{r.ticker}</td>
                    <td className="py-2.5 pr-4">{formatSentiment(r.sentiment_label)}</td>
                    <td className="py-2.5 pr-4">{r.is_earnings_related ? 'Yes' : 'No'}</td>
                    <td className="py-2.5 pr-4 text-gray-400">{r.sector}</td>
                    <td
                      className={`py-2.5 pr-4 text-right font-medium ${
                        r.predicted_car_3day >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {r.predicted_car_3day >= 0 ? '+' : ''}
                      {r.predicted_car_3day.toFixed(3)}%
                    </td>
                    <td className="py-2.5 text-right text-gray-400">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
