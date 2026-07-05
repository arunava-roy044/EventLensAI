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
  const [activeTab, setActiveTab] = useState('portfolio')

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
    <div className="flex bg-gray-900 text-white h-screen overflow-hidden">
      <Sidebar
        onBackToLanding={() => setView('landing')}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 flex flex-col h-screen">
        <div className="px-8 pt-8 pb-4 shrink-0">
          <h1 className="text-4xl font-bold text-purple-400">
            EventLens AI 🚀
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div key={activeTab} className="motion-safe:animate-[fadeSlide_0.35s_ease-out]">
            {activeTab === 'portfolio' && (
              <>
                <AddHoldingForm onHoldingAdded={handleHoldingAdded} />
                <PortfolioList
                  holdings={holdings}
                  loading={loading}
                  error={error}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              </>
            )}

            {activeTab === 'allocation' && (
              <PortfolioAllocationChart holdings={holdings} />
            )}

            {activeTab === 'risk' && (
              <RiskDashboard risk={risk} loading={riskLoading} />
            )}

            {activeTab === 'correlation' && (
              <CorrelationHeatmap />
            )}
          </div>
        </div>

        <style>{`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default App