import { useState } from 'react'
import Header from './components/Header.jsx'
import DailyCheckIn from './components/DailyCheckIn.jsx'
import Report from './components/Report.jsx'
import Onboarding from './components/Onboarding.jsx'

const STORAGE_KEY = 'ammt_v2'

function isValidShape(parsed) {
  return parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.entries)
}

// Reads localStorage once. Distinguishes "nothing stored yet" (new user, safe
// to onboard) from "something's stored but unreadable" (corrupted JSON or an
// unexpected shape) — the latter must never be silently treated as a new
// user, or the next save would overwrite whatever's actually still there.
function readStoredData() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) return { data: { cycle: null, entries: [] }, error: false }
  try {
    const parsed = JSON.parse(stored)
    if (isValidShape(parsed)) return { data: parsed, error: false }
    return { data: null, error: true }
  } catch (_) {
    return { data: null, error: true }
  }
}

function persistData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (_) {
    return false
  }
}

export default function App() {
  const [data, setData] = useState(() => readStoredData().data ?? { cycle: null, entries: [] })
  const [loadError, setLoadError] = useState(() => readStoredData().error)
  const [saveError, setSaveError] = useState(false)
  const [activeTab, setActiveTab] = useState('checkin')

  const { cycle, entries } = data

  const persist = (newData) => {
    setData(newData)
    setSaveError(!persistData(newData))
  }

  const setupCycle = (medicationName, dosage) => {
    persist({
      cycle: {
        medicationName,
        dosage,
        cycleStartDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      entries: [],
    })
  }

  const updateCycle = (updates) => {
    persist({ ...data, cycle: { ...cycle, ...updates } })
  }

  const saveEntry = (entry) => {
    const others = entries.filter(e => e.date !== entry.date)
    persist({
      ...data,
      entries: [...others, entry].sort((a, b) => a.date.localeCompare(b.date)),
    })
  }

  const resetCycle = () => {
    persist({
      cycle: {
        ...cycle,
        cycleStartDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      entries: [],
    })
  }

  const discardUnreadableData = () => {
    localStorage.removeItem(STORAGE_KEY)
    setLoadError(false)
    setData({ cycle: null, entries: [] })
  }

  if (loadError) {
    return <UnreadableDataScreen onDiscard={discardUnreadableData} />
  }

  if (!cycle) {
    return <Onboarding onSetup={setupCycle} />
  }

  return (
    <div className="min-h-screen bg-creme">
      {saveError && <SaveErrorBanner onDismiss={() => setSaveError(false)} />}

      <Header cycle={cycle} entries={entries} onUpdateCycle={updateCycle} />

      <main className="max-w-2xl mx-auto px-4 pb-12">
        {/* Tab bar */}
        <div className="flex rounded-b-xl overflow-hidden shadow-sm border border-t-0 border-gray-200 bg-white mb-0">
          <button
            onClick={() => setActiveTab('checkin')}
            aria-pressed={activeTab === 'checkin'}
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
            aria-pressed={activeTab === 'report'}
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
            <DailyCheckIn entries={entries} cycle={cycle} onSave={saveEntry} />
          )}
          {activeTab === 'report' && (
            <Report entries={entries} cycle={cycle} onReset={resetCycle} />
          )}
        </div>
      </main>
    </div>
  )
}

// Shown instead of onboarding/tracker when the stored data can't be parsed
// or doesn't look like our data shape. Never auto-clears localStorage —
// only this explicit, confirmed action does, so a recoverable mistake
// elsewhere (e.g. a bad manual edit in devtools) doesn't get wiped silently.
function UnreadableDataScreen({ onDiscard }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="min-h-screen bg-creme flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl" aria-hidden="true">⚠️</span>
        </div>
        <h1 className="text-lg font-bold text-gray-800 mb-2">Données illisibles</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Vos données enregistrées sur cet appareil semblent corrompues ou dans un format inattendu.
          Rien n'a été effacé — si vous pensez pouvoir les récupérer autrement, fermez cette page sans
          continuer ici.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-sm text-red-600 underline underline-offset-2 hover:no-underline"
          >
            Recommencer à zéro (efface les données illisibles)
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <p className="text-sm text-red-700 font-medium mb-3">
              Les données illisibles seront définitivement effacées de cet appareil. Cette action est
              irréversible.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onDiscard}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Oui, effacer et recommencer
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SaveErrorBanner({ onDismiss }) {
  return (
    <div
      role="alert"
      className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2.5 flex items-center justify-between gap-3"
    >
      <span>
        ⚠️ Impossible d'enregistrer — mémoire pleine ou navigation privée. Votre dernière saisie n'a
        pas été sauvegardée.
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer cet avertissement"
        className="text-red-500 hover:text-red-700 flex-shrink-0 text-base leading-none"
      >
        ✕
      </button>
    </div>
  )
}
