import { useState } from 'react'
import { getEntriesLast14Days } from '../utils/calculations.js'

export default function Header({ cycle, entries, onUpdateCycle }) {
  const [editing, setEditing] = useState(false)
  const [medName, setMedName] = useState(cycle.medicationName)
  const [dosage, setDosage] = useState(cycle.dosage)

  const recent = getEntriesLast14Days(entries)
  const today = new Date().toISOString().split('T')[0]
  const loggedToday = entries.some(e => e.date === today)

  const handleSave = () => {
    onUpdateCycle({ medicationName: medName.trim() || cycle.medicationName, dosage: dosage.trim() || cycle.dosage })
    setEditing(false)
  }

  const handleCancel = () => {
    setMedName(cycle.medicationName)
    setDosage(cycle.dosage)
    setEditing(false)
  }

  const formatCycleDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  return (
    <div className="bg-vert text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Left: medication info */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">💊</span>
            {editing ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  className="text-gray-900 px-2.5 py-1.5 rounded-lg text-sm w-36 font-medium"
                  placeholder="Médicament"
                  autoFocus
                />
                <input
                  value={dosage}
                  onChange={e => setDosage(e.target.value)}
                  className="text-gray-900 px-2.5 py-1.5 rounded-lg text-sm w-24 font-mono"
                  placeholder="Dosage"
                />
                <button
                  onClick={handleSave}
                  className="bg-jaune text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-yellow-300 transition-colors"
                >
                  ✓ Sauver
                </button>
                <button
                  onClick={handleCancel}
                  className="text-white/60 hover:text-white px-2 py-1.5 text-xs"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base truncate">{cycle.medicationName}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-mono flex-shrink-0">
                    {cycle.dosage}
                  </span>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-white/50 hover:text-white text-sm flex-shrink-0 transition-colors"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                </div>
                <div className="text-white/60 text-xs mt-0.5">
                  Cycle depuis le {formatCycleDate(cycle.cycleStartDate)}
                  {loggedToday && (
                    <span className="ml-2 text-jaune font-medium">✓ saisi aujourd'hui</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: progress counter */}
          {!editing && (
            <div className="text-right flex-shrink-0">
              <div className="font-mono font-bold text-2xl leading-none">
                {recent.length}
                <span className="text-white/50 text-base font-normal">/14</span>
              </div>
              <div className="text-white/60 text-xs mt-0.5">jours saisis</div>
              {recent.length >= 10 && (
                <div className="text-jaune text-xs mt-0.5">Rapport dispo ✓</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
