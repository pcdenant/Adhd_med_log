import { useState } from 'react'
import LikertScale from './LikertScale.jsx'
import { DIMENSIONS, SIDE_EFFECTS } from '../utils/calculations.js'

const WEAR_OFF_OPTIONS = [
  {
    value: 'none',
    label: 'Aucun — médicament pleinement actif',
    classes: 'border-green-200 bg-green-50 text-green-800',
    activeClasses: 'border-green-500 bg-green-100 text-green-900 ring-1 ring-green-400',
  },
  {
    value: 'mild',
    label: "Léger — je commence à sentir l'essoufflement, encore en grande partie efficace",
    classes: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    activeClasses: 'border-yellow-400 bg-yellow-100 text-yellow-900 ring-1 ring-yellow-400',
  },
  {
    value: 'strong',
    label: 'Fort — rebond ou essoufflement clair, nettement moins efficace',
    classes: 'border-red-200 bg-red-50 text-red-800',
    activeClasses: 'border-red-400 bg-red-100 text-red-900 ring-1 ring-red-400',
  },
]

const SEVERITY_OPTIONS = ['Léger', 'Modéré', 'Sévère']

function getCurrentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

const EMPTY_DIMENSIONS = {
  focus: null,
  taskInitiation: null,
  emotionalRegulation: null,
  impulseControl: null,
  workingMemory: null,
  timeAwareness: null,
}

const EMPTY_SIDE_EFFECTS = {
  appetiteSuppression: false,
  sleepDifficulty: false,
  headache: false,
  moodChanges: false,
  irritabilityRebound: false,
  anxiety: false,
  physicalSymptoms: false,
}

function entryToForm(entry) {
  return {
    timeTaken: entry.timeTaken ?? '',
    dimensions: { ...EMPTY_DIMENSIONS, ...entry.dimensions },
    wearOff: entry.wearOff ?? null,
    sideEffects: { ...EMPTY_SIDE_EFFECTS, ...entry.sideEffects },
    sideEffectSeverity: { ...entry.sideEffectSeverity },
    notes: entry.notes ?? '',
  }
}

const FRESH_FORM = {
  timeTaken: '',
  dimensions: { ...EMPTY_DIMENSIONS },
  wearOff: null,
  sideEffects: { ...EMPTY_SIDE_EFFECTS },
  sideEffectSeverity: {},
  notes: '',
}

export default function DailyCheckIn({ entries, onSave }) {
  const today = getTodayKey()
  const existingEntry = entries.find(e => e.date === today)

  const [editing, setEditing] = useState(!existingEntry)
  const [form, setForm] = useState(() =>
    existingEntry ? entryToForm(existingEntry) : { ...FRESH_FORM }
  )
  const [justSaved, setJustSaved] = useState(false)

  const now = new Date()
  const dateDisplay = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const setDimension = (key, value) => {
    setForm(f => ({ ...f, dimensions: { ...f.dimensions, [key]: value } }))
  }

  const toggleSideEffect = (key) => {
    setForm(f => {
      const active = !f.sideEffects[key]
      const newSev = { ...f.sideEffectSeverity }
      if (!active) delete newSev[key]
      return {
        ...f,
        sideEffects: { ...f.sideEffects, [key]: active },
        sideEffectSeverity: newSev,
      }
    })
  }

  const setSeverity = (key, severity) => {
    setForm(f => ({
      ...f,
      sideEffectSeverity: { ...f.sideEffectSeverity, [key]: severity },
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      date: today,
      timeLogged: getCurrentTime(),
    })
    setJustSaved(true)
    setEditing(false)
    setTimeout(() => setJustSaved(false), 4000)
  }

  // Already-logged view
  if (!editing && existingEntry) {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Saisie du jour enregistrée</h2>
          <p className="text-gray-500 text-sm capitalize">{dateDisplay}</p>
          <p className="text-gray-400 text-xs mt-1 mb-5 font-mono">
            Heure d'enregistrement : {existingEntry.timeLogged ?? '—'}
          </p>

          {justSaved && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl py-2.5 px-4 text-sm inline-block">
              ✓ Sauvegardé avec succès !
            </div>
          )}

          <div>
            <button
              onClick={() => {
                setForm(entryToForm(existingEntry))
                setEditing(true)
              }}
              className="text-sm text-vert underline underline-offset-2 hover:no-underline"
            >
              Modifier la saisie d'aujourd'hui
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Date header */}
      <div className="mb-7 pb-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 capitalize">{dateDisplay}</h2>
        <p className="text-xs text-gray-400 mt-0.5">Saisie quotidienne · environ 3 minutes</p>
      </div>

      {/* ── Section 1: Time taken ── */}
      <section className="mb-8">
        <SectionTitle icon="💊" label="Heure de prise" />
        <div className="max-w-xs">
          <input
            type="time"
            value={form.timeTaken}
            onChange={e => setForm(f => ({ ...f, timeTaken: e.target.value }))}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-xl focus:outline-none focus:ring-2 focus:ring-vert focus:border-transparent transition-shadow"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Heure à laquelle vous avez pris votre médicament ce matin
          </p>
        </div>
      </section>

      {/* ── Section 2: 6 Brown dimensions ── */}
      <section className="mb-8">
        <SectionTitle icon="🧠" label="Fonctions exécutives — Brown (6 dimensions)" />
        <div className="space-y-1">
          {DIMENSIONS.map(dim => (
            <LikertScale
              key={dim.key}
              label={dim.label}
              question={dim.question}
              value={form.dimensions[dim.key]}
              onChange={val => setDimension(dim.key, val)}
              lowLabel={dim.lowLabel}
              highLabel={dim.highLabel}
            />
          ))}
        </div>
      </section>

      {/* ── Section 3: Wear-off ── */}
      <section className="mb-8">
        <SectionTitle icon="⏱️" label="Essoufflement du médicament" />
        <p className="text-xs text-gray-500 italic mb-3">
          Comment le médicament agit-il en ce moment ?
        </p>
        <div className="space-y-2">
          {WEAR_OFF_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                form.wearOff === opt.value ? opt.activeClasses : opt.classes + ' opacity-80 hover:opacity-100'
              }`}
            >
              <input
                type="radio"
                name="wearOff"
                value={opt.value}
                checked={form.wearOff === opt.value}
                onChange={() => setForm(f => ({ ...f, wearOff: opt.value }))}
                className="mt-0.5 accent-vert flex-shrink-0"
              />
              <span className="text-sm leading-snug">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── Section 4: Side effects ── */}
      <section className="mb-8">
        <SectionTitle icon="⚠️" label="Effets secondaires" />
        <p className="text-xs text-gray-500 italic mb-3">
          Cochez ce que vous ressentez aujourd'hui (optionnel: précisez la sévérité)
        </p>
        <div className="space-y-2">
          {SIDE_EFFECTS.map(se => (
            <div
              key={se.key}
              className={`rounded-xl border overflow-hidden transition-colors ${
                form.sideEffects[se.key] ? 'border-orange-200' : 'border-gray-200'
              }`}
            >
              <label
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                  form.sideEffects[se.key] ? 'bg-orange-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.sideEffects[se.key]}
                  onChange={() => toggleSideEffect(se.key)}
                  className="w-4 h-4 accent-orange-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">{se.label}</span>
              </label>

              {form.sideEffects[se.key] && (
                <div className="px-4 pb-3 bg-orange-50 border-t border-orange-100">
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 flex-shrink-0">Sévérité :</span>
                    <div className="flex gap-1.5">
                      {SEVERITY_OPTIONS.map(sev => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSeverity(se.key, sev)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            form.sideEffectSeverity[se.key] === sev
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'border-orange-300 text-orange-600 hover:bg-orange-100'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 5: Free notes ── */}
      <section className="mb-8">
        <SectionTitle icon="📝" label="Notes libres" />
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value.slice(0, 500) }))}
          placeholder="Quoi d'autre aujourd'hui ? (stress, qualité du sommeil, observations…)"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-vert focus:border-transparent transition-shadow"
        />
        <div className="text-right text-xs text-gray-300 mt-1 font-mono">
          {form.notes.length}/500
        </div>
      </section>

      {/* ── Submit ── */}
      <button
        type="submit"
        className="w-full bg-vert text-white py-4 rounded-2xl font-semibold text-base hover:bg-vert-dark transition-colors shadow-sm hover:shadow-md"
      >
        Enregistrer la saisie du jour ✓
      </button>
    </form>
  )
}

function SectionTitle({ icon, label }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold text-vert uppercase tracking-widest mb-4">
      <span>{icon}</span>
      <span>{label}</span>
    </h3>
  )
}
