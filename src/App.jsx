import { useState } from 'react'
import Header from './components/Header.jsx'
import DailyCheckIn from './components/DailyCheckIn.jsx'
import Report from './components/Report.jsx'
import Onboarding from './components/Onboarding.jsx'

const STORAGE_KEY = 'ammt_v2'

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return { cycle: null, entries: [] }
}

function persistData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function App() {
  const [data, setData] = useState(loadData)
  const [activeTab, setActiveTab] = useState('checkin')

  const { cycle, entries } = data

  const setupCycle = (medicationName, dosage) => {
    const newData = {
      cycle: {
        medicationName,
        dosage,
        cycleStartDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      entries: [],
    }
    setData(newData)
    persistData(newData)
  }

  const updateCycle = (updates) => {
    const newData = { ...data, cycle: { ...cycle, ...updates } }
    setData(newData)
    persistData(newData)
  }

  const saveEntry = (entry) => {
    const others = entries.filter(e => e.date !== entry.date)
    const newData = {
      ...data,
      entries: [...others, entry].sort((a, b) => a.date.localeCompare(b.date)),
    }
    setData(newData)
    persistData(newData)
  }

  const resetCycle = () => {
    const newData = {
      cycle: {
        ...cycle,
        cycleStartDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      entries: [],
    }
    setData(newData)
    persistData(newData)
  }

  if (!cycle) {
    return <Onboarding onSetup={setupCycle} />
  }

  return (
    <div className="min-h-screen bg-creme">
      <Header cycle={cycle} entries={entries} onUpdateCycle={updateCycle} />

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Tab bar */}
        <div className="flex rounded-b-xl overflow-hidden shadow-sm border border-t-0 border-gray-200 bg-white mb-0">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'checkin'
                ? 'bg-vert text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Saisie du jour
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'report'
                ? 'bg-vert text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Rapport 2 semaines
          </button>
        </div>

        {/* Panel */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-200">
          {activeTab === 'checkin' && (
            <DailyCheckIn entries={entries} onSave={saveEntry} />
          )}
          {activeTab === 'report' && (
            <Report entries={entries} cycle={cycle} onReset={resetCycle} />
          )}
        </div>
      </div>
    </div>
  )
}
