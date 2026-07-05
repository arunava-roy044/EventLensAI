import { useState } from 'react'
import { usePortfolio } from './hooks/usePortfolio'
import { useRisk } from './hooks/useRisk'
import { LandingPage } from './components/LandingPage'
import { Sidebar } from './components/Sidebar'
import { AddHoldingForm } from './components/AddHoldingForm'
import { PortfolioList } from './components/PortfolioList'
import { PortfolioAllocationChart } from './components/PortfolioAllocationChart'
import { RiskDashboard } from './components/RiskDashboard'
import { CorrelationHeatmap } from './components/CorrelationHeatmap'

function App() {
  const [view, setView] = useState('landing') // 'landing' | 'dashboard'

  const { holdings, loading, error, refetch, deleteHolding, updateHolding } = usePortfolio()
  const { risk, loading: riskLoading, refetchRisk } = useRisk()

  const handleHoldingAdded = () => {
    refetch()
    refetchRisk()
  }

  const handleDelete = (id) => {
    deleteHolding(id)
    refetchRisk()
  }

  const handleUpdate = (id, shares) => {
    updateHolding(id, shares)
    refetchRisk()
  }

  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('dashboard')} />
  }

  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      <Sidebar onBackToLanding={() => setView('landing')} />

      <div className="flex-1 p-8">
        <h1 className="text-4xl font-bold text-purple-400 mb-6">
          EventLens AI 🚀
        </h1>

        <div id="portfolio">
          <AddHoldingForm onHoldingAdded={handleHoldingAdded} />

          <PortfolioList
            holdings={holdings}
            loading={loading}
            error={error}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        </div>

        <div id="allocation">
          <PortfolioAllocationChart holdings={holdings} />
        </div>

        <div id="risk">
          <RiskDashboard risk={risk} loading={riskLoading} />
        </div>

        <div id="correlation">
          <CorrelationHeatmap />
        </div>
      </div>
    </div>
  )
}

export default App