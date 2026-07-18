import { useState, useEffect } from 'react'
import LikertScale from './LikertScale.jsx'
import DayStrip from './DayStrip.jsx'
import { DIMENSIONS, SIDE_EFFECTS, getTodayKey, buildDayWindow } from '../utils/calculations.js'

const WEAR_OFF_OPTIONS = [
  {
    value: 'none',
    short: 'Aucun',
    label: 'Aucun — médicament pleinement actif',
    classes: 'border-green-200 bg-green-50 text-green-800',
    activeClasses: 'border-green-500 bg-green-100 text-green-900 ring-1 ring-green-400',
  },
  {
    value: 'mild',
    short: 'Léger',
    label: "Léger — je commence à sentir l'essoufflement, encore en grande partie efficace",
    classes: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    activeClasses: 'border-yellow-400 bg-yellow-100 text-yellow-900 ring-1 ring-yellow-400',
  },
  {
    value: 'strong',
    short: 'Fort',
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
    checkInTime: entry.timeLogged ?? '',
    dimensions: { ...EMPTY_DIMENSIONS, ...entry.dimensions },
    wearOff: entry.wearOff ?? null,
    sideEffects: { ...EMPTY_SIDE_EFFECTS, ...entry.sideEffects },
    sideEffectSeverity: { ...entry.sideEffectSeverity },
    notes: entry.notes ?? '',
  }
}

const FRESH_FORM = {
  timeTaken: '',
  checkInTime: '',
  dimensions: { ...EMPTY_DIMENSIONS },
  wearOff: null,
  sideEffects: { ...EMPTY_SIDE_EFFECTS },
  sideEffectSeverity: {},
  notes: '',
}

function formatLongDate(dateKey) {
  return new Date(dateKey + 'T12:00:00Z').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function relativeLabel(dateKey, todayKey) {
  if (dateKey === todayKey) return "aujourd'hui"
  const days = Math.round(
    (new Date(todayKey + 'T12:00:00Z') - new Date(dateKey + 'T12:00:00Z')) / 86400000
  )
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}

// Accordion section order. Time/dimensions/wear-off auto-advance to the next
// section once complete; side effects and notes are optional and never
// block or trigger advance — the user opens them via their header if wanted.
const TIME = 0
const DIMENSIONS_SECTION = 1
const WEAR_OFF = 2
const SIDE_EFFECTS_SECTION = 3
const NOTES = 4

function dimensionsSummary(form) {
  const filled = DIMENSIONS.filter(d => form.dimensions[d.key] != null).length
  return filled > 0 ? `${filled}/6 notées` : null
}

function sideEffectsSummary(form) {
  const count = SIDE_EFFECTS.filter(se => form.sideEffects[se.key]).length
  return count > 0 ? `${count} coché${count > 1 ? 's' : ''}` : null
}

export default function DailyCheckIn({ entries, cycle, onSave }) {
  const todayKey = getTodayKey()
  const [selectedDate, setSelectedDate] = useState(todayKey)

  const existingEntry = entries.find(e => e.date === selectedDate)
  const isToday = selectedDate === todayKey

  const [editing, setEditing] = useState(!existingEntry)
  const [form, setForm] = useState(() =>
    existingEntry ? entryToForm(existingEntry) : { ...FRESH_FORM }
  )
  const [justSaved, setJustSaved] = useState(false)
  const [activeSection, setActiveSection] = useState(TIME)

  // Switching to another day reloads the form for that day and restarts the accordion.
  useEffect(() => {
    const entry = entries.find(e => e.date === selectedDate)
    setForm(entry ? entryToForm(entry) : { ...FRESH_FORM })
    setEditing(!entry)
    setJustSaved(false)
    setActiveSection(TIME)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const days = buildDayWindow(cycle?.cycleStartDate, todayKey)
  const loggedDates = new Set(entries.map(e => e.date))

  const dateDisplay = formatLongDate(selectedDate)
  const relative = relativeLabel(selectedDate, todayKey)

  const handleTimeChange = (value) => {
    setForm(f => ({ ...f, timeTaken: value }))
    if (/^\d{2}:\d{2}$/.test(value)) setActiveSection(DIMENSIONS_SECTION)
  }

  const setDimension = (key, value) => {
    const dimensions = { ...form.dimensions, [key]: value }
    setForm(f => ({ ...f, dimensions }))
    if (DIMENSIONS.every(d => dimensions[d.key] != null)) setActiveSection(WEAR_OFF)
  }

  const handleWearOffChange = (value) => {
    setForm(f => ({ ...f, wearOff: value }))
    setActiveSection(SIDE_EFFECTS_SECTION)
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
    const { checkInTime, ...rest } = form
    // Today logs "now"; a backfilled day uses the optional check-in time the
    // user gave (may be empty — an empty timeLogged is simply excluded from the
    // wear-off timeline, never fabricated).
    const timeLogged = isToday ? getCurrentTime() : (checkInTime || '')
    onSave({ ...rest, date: selectedDate, timeLogged })
    setJustSaved(true)
    setEditing(false)
    setTimeout(() => setJustSaved(false), 4000)
  }

  const sectionsTouched = [
    !!form.timeTaken,
    dimensionsSummary(form) != null,
    form.wearOff != null,
    sideEffectsSummary(form) != null,
    form.notes.length > 0,
  ].filter(Boolean).length

  const navigator = (
    <>
      <DayStrip
        days={days}
        loggedDates={loggedDates}
        selectedDate={selectedDate}
        todayKey={todayKey}
        onSelect={setSelectedDate}
      />
      {!isToday && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-vert-light px-4 py-2.5">
          <p className="text-xs text-vert-dark">
            Vous complétez <strong>{relative}</strong>.
          </p>
          <button
            type="button"
            onClick={() => setSelectedDate(todayKey)}
            className="text-xs font-semibold text-vert underline underline-offset-2 hover:no-underline whitespace-nowrap"
          >
            Revenir à aujourd'hui
          </button>
        </div>
      )}
    </>
  )

  // Already-logged view for the selected day.
  if (!editing && existingEntry) {
    return (
      <div className="p-6">
        {navigator}
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl" aria-hidden="true">✅</span>
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            {isToday ? 'Saisie du jour enregistrée' : 'Journée déjà saisie'}
          </h2>
          <p className="text-gray-500 text-sm capitalize">{dateDisplay}</p>
          <p className="text-gray-500 text-xs mt-1 mb-5 font-mono">
            Heure d'enregistrement : {existingEntry.timeLogged || '—'}
          </p>

          {justSaved && (
            <div role="status" className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl py-2.5 px-4 text-sm inline-block">
              ✓ Sauvegardé avec succès !
            </div>
          )}

          <div>
            <button
              onClick={() => {
                setForm(entryToForm(existingEntry))
                setEditing(true)
                setActiveSection(TIME)
              }}
              className="text-sm text-vert underline underline-offset-2 hover:no-underline"
            >
              {isToday ? "Modifier la saisie d'aujourd'hui" : 'Modifier cette journée'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {navigator}
      <form onSubmit={handleSubmit}>
        {/* Date header */}
        <div className="mb-1 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800 capitalize">{dateDisplay}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isToday ? 'Saisie quotidienne · environ 3 minutes' : `Rattrapage · ${relative}`}
            </p>
          </div>
          <span className="text-xs font-mono text-gray-500 flex-shrink-0 mt-0.5">{sectionsTouched}/5</span>
        </div>

        {/* ── Section 1: Time taken ── */}
        <AccordionSection
          id="time"
          icon="💊"
          label="Heure de prise"
          summary={form.timeTaken ? `Prise à ${form.timeTaken}` : null}
          isOpen={activeSection === TIME}
          onToggle={() => setActiveSection(TIME)}
        >
          <div className="max-w-xs">
            <input
              type="time"
              value={form.timeTaken}
              onChange={e => handleTimeChange(e.target.value)}
              required
              aria-label="Heure de prise du médicament"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-xl focus:outline-none focus:ring-2 focus:ring-vert focus:border-transparent transition-shadow"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Heure à laquelle vous avez pris votre médicament{isToday ? ' ce matin' : ' ce jour-là'}
            </p>
          </div>

          {!isToday && (
            <div className="max-w-xs mt-4">
              <input
                type="time"
                value={form.checkInTime}
                onChange={e => setForm(f => ({ ...f, checkInTime: e.target.value }))}
                aria-label="Heure du point (évaluation)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-base focus:outline-none focus:ring-2 focus:ring-vert focus:border-transparent transition-shadow"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Heure du point (optionnel) — à quel moment vous faisiez l'évaluation. Sert uniquement à
                la courbe d'efficacité ; laissez vide si vous ne savez plus.
              </p>
            </div>
          )}
        </AccordionSection>

        {/* ── Section 2: 6 Brown dimensions ── */}
        <AccordionSection
          id="dimensions"
          icon="🧠"
          label="Fonctions exécutives — Brown (6 dimensions)"
          summary={dimensionsSummary(form)}
          isOpen={activeSection === DIMENSIONS_SECTION}
          onToggle={() => setActiveSection(DIMENSIONS_SECTION)}
        >
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
        </AccordionSection>

        {/* ── Section 3: Wear-off ── */}
        <AccordionSection
          id="wear-off"
          icon="⏱️"
          label="Essoufflement du médicament"
          summary={WEAR_OFF_OPTIONS.find(o => o.value === form.wearOff)?.short ?? null}
          isOpen={activeSection === WEAR_OFF}
          onToggle={() => setActiveSection(WEAR_OFF)}
        >
          <p className="text-xs text-gray-500 italic mb-3">
            Comment le médicament agit-il {isToday ? 'en ce moment' : 'ce jour-là'} ?
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
                  onChange={() => handleWearOffChange(opt.value)}
                  className="mt-0.5 accent-vert flex-shrink-0"
                />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            ))}
          </div>
        </AccordionSection>

        {/* ── Section 4: Side effects ── */}
        <AccordionSection
          id="side-effects"
          icon="⚠️"
          label="Effets secondaires"
          summary={sideEffectsSummary(form) ?? 'Aucun'}
          isOpen={activeSection === SIDE_EFFECTS_SECTION}
          onToggle={() => setActiveSection(SIDE_EFFECTS_SECTION)}
        >
          <p className="text-xs text-gray-500 italic mb-3">
            Cochez ce que vous ressentez {isToday ? "aujourd'hui" : 'ce jour-là'} (optionnel : précisez la sévérité)
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
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Sévérité : ${se.label}`}>
                        {SEVERITY_OPTIONS.map(sev => (
                          <button
                            key={sev}
                            type="button"
                            aria-pressed={form.sideEffectSeverity[se.key] === sev}
                            onClick={() => setSeverity(se.key, sev)}
                            className={`text-xs px-3 py-2.5 rounded-full border transition-colors ${
                              form.sideEffectSeverity[se.key] === sev
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'border-orange-400 text-orange-700 hover:bg-orange-100'
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
        </AccordionSection>

        {/* ── Section 5: Free notes ── */}
        <AccordionSection
          id="notes"
          icon="📝"
          label="Notes libres"
          summary={form.notes ? `${form.notes.length} caractère${form.notes.length > 1 ? 's' : ''}` : null}
          isOpen={activeSection === NOTES}
          onToggle={() => setActiveSection(NOTES)}
          last
        >
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value.slice(0, 500) }))}
            placeholder="Quoi d'autre ? (stress, qualité du sommeil, observations…)"
            rows={3}
            aria-label="Notes libres"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-vert focus:border-transparent transition-shadow"
          />
          <div className="text-right text-xs text-gray-500 mt-1 font-mono">
            {form.notes.length}/500
          </div>
        </AccordionSection>

        {/* ── Submit ── */}
        <button
          type="submit"
          className="w-full mt-6 bg-vert text-white py-4 rounded-2xl font-semibold text-base hover:bg-vert-dark transition-colors shadow-sm hover:shadow-md"
        >
          {isToday ? 'Enregistrer la saisie du jour ✓' : 'Enregistrer cette journée ✓'}
        </button>
      </form>
    </div>
  )
}

// One accordion section: a heading-wrapped toggle button (title, collapsed
// summary, chevron) plus a content panel. Only the active panel is rendered
// visible/reachable (`hidden`), so the daily form never shows more than one
// section's worth of decisions at once, for keyboard and screen-reader users
// too, not just visually.
function AccordionSection({ id, icon, label, summary, isOpen, onToggle, last, children }) {
  const panelId = `checkin-panel-${id}`
  const headerId = `checkin-header-${id}`
  return (
    <section className={last ? 'py-4' : 'py-4 border-b border-gray-100'}>
      <h3 className="m-0">
        <button
          type="button"
          id={headerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <span className={`flex items-center gap-2 text-sm font-semibold ${isOpen ? 'text-vert' : 'text-gray-700'}`}>
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </span>
          <span className="flex items-center gap-2 flex-shrink-0">
            {!isOpen && summary && (
              <span className="text-xs font-normal normal-case tracking-normal text-gray-500 truncate max-w-[40vw] sm:max-w-xs">
                {summary}
              </span>
            )}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 text-vert transition-transform motion-reduce:transition-none duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              />
            </svg>
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!isOpen} className="pt-4">
        {children}
      </div>
    </section>
  )
}
