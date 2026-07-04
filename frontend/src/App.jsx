import { usePortfolio } from './hooks/usePortfolio'
import { useRisk } from './hooks/useRisk'
import { AddHoldingForm } from './components/AddHoldingForm'
import { PortfolioList } from './components/PortfolioList'
import { RiskDashboard } from './components/RiskDashboard'

function App() {
  const { holdings, loading, error, refetch, deleteHolding } = usePortfolio()
  const { risk, loading: riskLoading } = useRisk()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-purple-400 mb-6">
        EventLens AI 🚀
      </h1>

      <AddHoldingForm onHoldingAdded={refetch} />

      <PortfolioList
        holdings={holdings}
        loading={loading}
        error={error}
        onDelete={deleteHolding}
      />

      <RiskDashboard risk={risk} loading={riskLoading} />
    </div>
  )
}

export default App