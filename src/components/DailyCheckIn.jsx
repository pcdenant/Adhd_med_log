import { useState, useEffect, useRef } from 'react'
import LikertScale from './LikertScale.jsx'
import DayStrip from './DayStrip.jsx'
import {
  DIMENSIONS,
  SIDE_EFFECTS,
  REQUIRED_ANSWERS,
  getTodayKey,
  buildDayWindow,
  isCompleteEntry,
  missingRequired,
  usualDoseTime,
} from '../utils/calculations.js'
import { PillIcon, BrainIcon, ClockIcon, AlertTriangleIcon, NoteIcon, CheckCircleIcon } from './icons.jsx'

// Same success/warning/danger vocabulary as severityColors.js (design.md ->
// Semantic status colours) — wear-off severity is a clinical signal, so it
// never borrows the brand primary/accent tokens.
const WEAR_OFF_OPTIONS = [
  {
    value: 'none',
    short: 'Aucun',
    label: 'Aucun — médicament pleinement actif',
    classes: 'border-[#B7D6C2] bg-[#EAF3EC] text-[#2F6B44]',
    activeClasses: 'border-[#2F6B44] bg-[#EAF3EC] text-[#2F6B44] ring-1 ring-[#2F6B44]',
  },
  {
    value: 'mild',
    short: 'Léger',
    label: "Léger — je commence à sentir l'essoufflement, encore en grande partie efficace",
    classes: 'border-[#EBDB9C] bg-[#FCF3D9] text-[#6B5814]',
    activeClasses: 'border-[#6B5814] bg-[#FCF3D9] text-[#6B5814] ring-1 ring-[#6B5814]',
  },
  {
    value: 'strong',
    short: 'Fort',
    label: 'Fort — rebond ou essoufflement clair, nettement moins efficace',
    classes: 'border-[#E3B3AF] bg-[#FBEAE8] text-[#9C3C3D]',
    activeClasses: 'border-[#9C3C3D] bg-[#FBEAE8] text-[#9C3C3D] ring-1 ring-[#9C3C3D]',
  },
]

const SEVERITY_OPTIONS = ['Léger', 'Modéré', 'Sévère']

// design.md -> Focus: 3px primary ring, 2px offset, on every control here.
const FOCUS_RING = 'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-offset-2'
const FIELD_FOCUS = 'focus:outline-none focus:ring-[3px] focus:ring-primary focus:ring-offset-2'

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

function formatDayMonth(dateKey) {
  return new Date(dateKey + 'T12:00:00Z').toLocaleDateString('fr-FR', {
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

// Which accordion section holds each required answer (REQUIRED_ANSWERS keys).
const SECTION_OF = { time: TIME, dimensions: DIMENSIONS_SECTION, wearOff: WEAR_OFF }

const requiredLabels = (keys) =>
  keys.map(k => REQUIRED_ANSWERS.find(r => r.key === k).label).join(', ')

const missingText = (keys) =>
  `Encore ${keys.length} réponse${keys.length > 1 ? 's' : ''} : ${requiredLabels(keys)}`

function dimensionsSummary(form) {
  const filled = DIMENSIONS.filter(d => form.dimensions[d.key] != null).length
  return filled > 0 ? `${filled}/6 notées` : `${DIMENSIONS.length} questions`
}

// Never "Aucun" by default: an unticked list is an unanswered optional section.
function sideEffectsSummary(form) {
  const count = SIDE_EFFECTS.filter(se => form.sideEffects[se.key]).length
  return count > 0 ? `${count} coché${count > 1 ? 's' : ''}` : 'Facultatif'
}

export default function DailyCheckIn({ entries, cycle, onSave }) {
  const todayKey = getTodayKey()
  const [selectedDate, setSelectedDate] = useState(todayKey)

  const existingEntry = entries.find(e => e.date === selectedDate)
  const isToday = selectedDate === todayKey

  // An incomplete stored entry (older data) opens in edit mode, pre-filled,
  // on its first missing section.
  const firstSectionFor = (entry) =>
    entry ? SECTION_OF[missingRequired(entry)[0]] ?? TIME : TIME
  const [editing, setEditing] = useState(!existingEntry || !isCompleteEntry(existingEntry))
  const [form, setForm] = useState(() =>
    existingEntry ? entryToForm(existingEntry) : { ...FRESH_FORM }
  )
  const [justSaved, setJustSaved] = useState(false)
  const [activeSection, setActiveSection] = useState(() => firstSectionFor(existingEntry))
  const [announce, setAnnounce] = useState('')
  const headerRefs = useRef({})

  // Switching to another day reloads the form for that day and restarts the accordion.
  useEffect(() => {
    const entry = entries.find(e => e.date === selectedDate)
    setForm(entry ? entryToForm(entry) : { ...FRESH_FORM })
    setEditing(!entry || !isCompleteEntry(entry))
    setJustSaved(false)
    setAnnounce('')
    setActiveSection(firstSectionFor(entry))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const days = buildDayWindow(cycle?.cycleStartDate, todayKey)
  const loggedDates = new Set(entries.filter(isCompleteEntry).map(e => e.date))
  const usualTime = usualDoseTime(entries, selectedDate)
  // The form state has the entry shape, so the one complete-entry rule applies to it.
  const missing = missingRequired(form)

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
    // Only a complete entry is ever stored. Otherwise: open the first missing
    // section, move focus to its header, announce what's left.
    if (missing.length > 0) {
      const section = SECTION_OF[missing[0]]
      setActiveSection(section)
      headerRefs.current[section]?.focus()
      setAnnounce(`Rien n'est encore enregistré. ${missingText(missing)}.`)
      return
    }
    setAnnounce('')
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

  const answered = REQUIRED_ANSWERS.length - missing.length

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
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-primary-light px-4 py-2.5">
          <p className="text-sm text-primary-dark">
            Vous complétez <strong>{relative}</strong>.
          </p>
          <button
            type="button"
            onClick={() => setSelectedDate(todayKey)}
            className={`text-sm font-semibold text-primary underline underline-offset-2 hover:no-underline whitespace-nowrap rounded ${FOCUS_RING}`}
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
          <div className="w-16 h-16 bg-success-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-success-700" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            {isToday ? 'Saisie du jour enregistrée' : 'Journée déjà saisie'}
          </h2>
          <p className="text-gray-500 text-sm capitalize">{dateDisplay}</p>
          <p className="text-gray-500 text-xs mt-1 mb-5 font-mono">
            Heure d'enregistrement : {existingEntry.timeLogged || '—'}
          </p>

          {justSaved && (
            <div role="status" className="mb-4 bg-success-50 border border-success-700/30 text-success-700 rounded-xl py-2.5 px-4 text-sm inline-block">
              <span aria-hidden="true">✓ </span>Sauvegardé avec succès !
            </div>
          )}

          <div>
            <button
              onClick={() => {
                setForm(entryToForm(existingEntry))
                setEditing(true)
                setActiveSection(TIME)
              }}
              className={`text-sm text-primary underline underline-offset-2 hover:no-underline rounded ${FOCUS_RING}`}
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
      <form onSubmit={handleSubmit} noValidate>
        {/* Date header + progress on the three required answers */}
        <div className="mb-1 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 capitalize">{dateDisplay}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isToday ? 'Saisie quotidienne' : `Rattrapage · ${relative}`}
          </p>
          <div aria-hidden="true" className="grid grid-cols-3 gap-1.5 mt-3">
            {REQUIRED_ANSWERS.map((r, i) => (
              <span
                key={r.key}
                className={`h-1.5 rounded-full transition-colors motion-reduce:transition-none ${i < answered ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            {answered} sur {REQUIRED_ANSWERS.length} réponses obligatoires · environ 3 minutes
          </p>
        </div>

        {/* ── Section 1: Time taken ── */}
        <AccordionSection
          id="time"
          icon={<PillIcon className="w-4 h-4" />}
          label="Heure de prise"
          summary={form.timeTaken ? `Prise à ${form.timeTaken}` : '1 question'}
          isOpen={activeSection === TIME}
          onToggle={() => setActiveSection(TIME)}
          buttonRef={el => { headerRefs.current[TIME] = el }}
        >
          <div className="max-w-xs">
            <input
              type="time"
              value={form.timeTaken}
              onChange={e => handleTimeChange(e.target.value)}
              required
              aria-label="Heure de prise du médicament"
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-xl ${FIELD_FOCUS}`}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Heure à laquelle vous avez pris votre médicament{isToday ? ' ce matin' : ' ce jour-là'}
            </p>
            {usualTime && form.timeTaken !== usualTime && (
              <button
                type="button"
                onClick={() => handleTimeChange(usualTime)}
                className={`mt-3 min-h-[44px] px-4 rounded-full border border-primary text-primary text-sm hover:bg-primary-light transition-colors motion-reduce:transition-none ${FOCUS_RING}`}
              >
                Comme d'habitude : <span className="font-mono font-semibold">{usualTime}</span>
              </button>
            )}
          </div>

          {!isToday && (
            <div className="max-w-xs mt-4">
              <input
                type="time"
                value={form.checkInTime}
                onChange={e => setForm(f => ({ ...f, checkInTime: e.target.value }))}
                aria-label="Heure du point (évaluation)"
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-base ${FIELD_FOCUS}`}
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
          icon={<BrainIcon className="w-4 h-4" />}
          label="Fonctions exécutives"
          summary={dimensionsSummary(form)}
          isOpen={activeSection === DIMENSIONS_SECTION}
          onToggle={() => setActiveSection(DIMENSIONS_SECTION)}
          buttonRef={el => { headerRefs.current[DIMENSIONS_SECTION] = el }}
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
          icon={<ClockIcon className="w-4 h-4" />}
          label="Essoufflement du médicament"
          summary={WEAR_OFF_OPTIONS.find(o => o.value === form.wearOff)?.short ?? '1 question'}
          isOpen={activeSection === WEAR_OFF}
          onToggle={() => setActiveSection(WEAR_OFF)}
          buttonRef={el => { headerRefs.current[WEAR_OFF] = el }}
        >
          <p className="text-xs text-gray-500 italic mb-3">
            Comment le médicament agit-il {isToday ? 'en ce moment' : 'ce jour-là'} ?
          </p>
          <div className="space-y-2">
            {WEAR_OFF_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors motion-reduce:transition-none ${
                  form.wearOff === opt.value ? opt.activeClasses : opt.classes + ' opacity-80 hover:opacity-100'
                }`}
              >
                <input
                  type="radio"
                  name="wearOff"
                  value={opt.value}
                  checked={form.wearOff === opt.value}
                  onChange={() => handleWearOffChange(opt.value)}
                  className={`mt-0.5 accent-primary flex-shrink-0 ${FOCUS_RING}`}
                />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            ))}
          </div>
        </AccordionSection>

        {/* ── Section 4: Side effects ── */}
        <AccordionSection
          id="side-effects"
          icon={<AlertTriangleIcon className="w-4 h-4" />}
          label="Effets secondaires"
          summary={sideEffectsSummary(form)}
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
                    className={`w-4 h-4 accent-orange-500 flex-shrink-0 ${FOCUS_RING}`}
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
                            className={`text-xs px-3 py-2.5 rounded-full border transition-colors motion-reduce:transition-none ${FOCUS_RING} ${
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
          icon={<NoteIcon className="w-4 h-4" />}
          label="Notes libres"
          summary={form.notes ? `${form.notes.length} caractère${form.notes.length > 1 ? 's' : ''}` : 'Facultatif'}
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
            className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none ${FIELD_FOCUS}`}
          />
          <div className="text-right text-xs text-gray-500 mt-1 font-mono">
            {form.notes.length}/500
          </div>
        </AccordionSection>

        {/* ── Submit ── always tappable; with answers missing it says what's
            left, and tapping it jumps to the first missing section. */}
        {missing.length > 0 && (
          <p id="checkin-missing" className="mt-6 text-sm text-gray-600 text-center">
            {missingText(missing)}
          </p>
        )}
        <button
          type="submit"
          aria-describedby={missing.length > 0 ? 'checkin-missing' : undefined}
          className={`w-full ${missing.length > 0 ? 'mt-2' : 'mt-6'} bg-primary text-white py-4 rounded-2xl font-semibold text-base hover:bg-primary-dark transition-colors motion-reduce:transition-none shadow-sm ${FOCUS_RING}`}
        >
          Enregistrer le {formatDayMonth(selectedDate)}
        </button>
        <p role="status" aria-live="polite" className="sr-only">{announce}</p>
      </form>
    </div>
  )
}

// One accordion section: a heading-wrapped toggle button (title, collapsed
// summary, chevron) plus a content panel. Only the active panel is rendered
// visible/reachable (`hidden`), so the daily form never shows more than one
// section's worth of decisions at once, for keyboard and screen-reader users
// too, not just visually.
function AccordionSection({ id, icon, label, summary, isOpen, onToggle, last, buttonRef, children }) {
  const panelId = `checkin-panel-${id}`
  const headerId = `checkin-header-${id}`
  return (
    <section className={last ? 'py-2' : 'py-2 border-b border-gray-100'}>
      <h3 className="m-0">
        {/* The whole row is the target: full width, 44px min (design.md). */}
        <button
          type="button"
          id={headerId}
          ref={buttonRef}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className={`w-full min-h-[44px] py-2 flex items-center justify-between gap-3 text-left rounded-lg ${FOCUS_RING}`}
        >
          <span className={`flex items-center gap-2 text-sm font-semibold ${isOpen ? 'text-primary' : 'text-gray-700'}`}>
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
              className={`w-4 h-4 text-primary transition-transform motion-reduce:transition-none duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
      <div id={panelId} hidden={!isOpen} className="pt-2 pb-2">
        {children}
      </div>
    </section>
  )
}
