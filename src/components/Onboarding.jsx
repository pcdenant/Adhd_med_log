import { useRef, useState } from 'react'
import { PillIcon } from './icons.jsx'
import Portee from './Portee.jsx'
import {
  getTodayKey,
  cycleStartBounds,
  daysBefore,
  isValidCycleStart,
  shiftKey,
  buildDayWindow,
  MAX_DAYS_BACK,
} from '../utils/calculations.js'

const NO_DATES = new Set()

const START_CHOICES = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: 'other', label: 'Autre jour' },
]

const inputClass = (invalid) =>
  `w-full px-4 py-3 border rounded-xl text-base bg-white placeholder:text-gray-500 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-offset-2 ${
    invalid ? 'border-danger-700' : 'border-gray-300'
  }`

const formatLong = (key) =>
  new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

export default function Onboarding({ onSetup }) {
  const today = getTodayKey()
  const { min, max } = cycleStartBounds(today)
  const yesterday = shiftKey(today, -1)

  const [medName, setMedName] = useState('')
  const [dosage, setDosage] = useState('')
  const [startChoice, setStartChoice] = useState('today')
  const [otherDate, setOtherDate] = useState('')
  const [errors, setErrors] = useState({})

  const medRef = useRef(null)
  const dosageRef = useRef(null)
  const dateRef = useRef(null)

  const startDate =
    startChoice === 'today' ? today : startChoice === 'yesterday' ? yesterday : otherDate
  // Days to backfill shown in the portée preview; 0 until a valid date is set.
  const daysBack = isValidCycleStart(startDate, today) ? daysBefore(startDate, today) : 0

  const chooseStart = (key) => {
    setStartChoice(key)
    if (key !== 'other') setOtherDate('')
    setErrors(prev => ({ ...prev, start: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    if (!medName.trim()) next.med = 'Indiquez le nom du médicament.'
    if (!dosage.trim()) next.dosage = 'Indiquez le dosage.'
    if (!isValidCycleStart(startDate, today)) {
      next.start = `Choisissez une date entre le ${formatLong(min)} et aujourd'hui.`
    }
    setErrors(next)

    // Focus the first invalid field so the error is the next thing read.
    if (next.med) return medRef.current?.focus()
    if (next.dosage) return dosageRef.current?.focus()
    if (next.start) return dateRef.current?.focus()

    onSetup(medName.trim(), dosage.trim(), startDate)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PillIcon className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-primary mb-2">Suivi Médicament TDAH</h1>
          <p className="text-muted text-base leading-relaxed text-balance">
            Une saisie par jour, environ 3 minutes. Au bout de 14 jours, un bilan clair à montrer à
            votre médecin.
          </p>
        </div>

        {/* Portée preview: nothing is logged yet, so only "à compléter" (dashed),
            today (outlined) and days to come (faint). */}
        <div className="bg-bg rounded-xl p-4 mb-6">
          <Portee
            days={buildDayWindow(daysBack > 0 ? startDate : today, today)}
            completeDates={NO_DATES}
            todayKey={today}
          />
          <p className="text-sm text-muted mt-2">
            Un trait par jour. Il se remplit à chaque saisie.
            {daysBack > 0 &&
              ` Vous pourrez compléter ${daysBack === 1 ? 'le jour passé' : `les ${daysBack} jours passés`} depuis la saisie.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="onboarding-med" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nom du médicament
            </label>
            <input
              ref={medRef}
              id="onboarding-med"
              type="text"
              required
              value={medName}
              onChange={e => setMedName(e.target.value)}
              placeholder="ex : Concerta, Ritaline, Vyvanse…"
              aria-invalid={errors.med ? 'true' : undefined}
              aria-describedby={errors.med ? 'onboarding-med-error onboarding-med-help' : 'onboarding-med-help'}
              className={inputClass(errors.med)}
            />
            {errors.med && (
              <p id="onboarding-med-error" className="text-sm text-danger-700 font-semibold mt-1.5">{errors.med}</p>
            )}
            <p id="onboarding-med-help" className="text-sm text-muted mt-1.5">Il apparaîtra en tête du bilan.</p>
          </div>

          <div>
            <label htmlFor="onboarding-dosage" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Dosage
            </label>
            <input
              ref={dosageRef}
              id="onboarding-dosage"
              type="text"
              required
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="ex : 36 mg, 20 mg XR…"
              aria-invalid={errors.dosage ? 'true' : undefined}
              aria-describedby={errors.dosage ? 'onboarding-dosage-error onboarding-dosage-help' : 'onboarding-dosage-help'}
              className={`${inputClass(errors.dosage)} font-mono`}
            />
            {errors.dosage && (
              <p id="onboarding-dosage-error" className="text-sm text-danger-700 font-semibold mt-1.5">{errors.dosage}</p>
            )}
            <p id="onboarding-dosage-help" className="text-sm text-muted mt-1.5">
              Tel qu'écrit sur la boîte. Modifiable plus tard dans l'en-tête.
            </p>
          </div>

          <fieldset>
            <legend className="block text-sm font-semibold text-gray-700 mb-1.5">Premier jour du suivi</legend>
            <div className="grid grid-cols-3 gap-2">
              {START_CHOICES.map(c => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={startChoice === c.key}
                  onClick={() => chooseStart(c.key)}
                  className={`min-h-[48px] px-1 rounded-xl text-[15px] transition-colors focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    startChoice === c.key
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-primary-light'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {startChoice === 'other' && (
              <div className="mt-3">
                <label htmlFor="onboarding-start" className="block text-sm text-muted mb-1.5">
                  Date de début ({MAX_DAYS_BACK} jours en arrière au plus)
                </label>
                <input
                  ref={dateRef}
                  id="onboarding-start"
                  type="date"
                  min={min}
                  max={max}
                  value={otherDate}
                  onChange={e => {
                    setOtherDate(e.target.value)
                    setErrors(prev => ({ ...prev, start: undefined }))
                  }}
                  aria-invalid={errors.start ? 'true' : undefined}
                  aria-describedby={errors.start ? 'onboarding-start-error' : undefined}
                  className={`${inputClass(errors.start)} font-mono`}
                />
                {errors.start && (
                  <p id="onboarding-start-error" className="text-sm text-danger-700 font-semibold mt-1.5">
                    {errors.start}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <button
            type="submit"
            className="w-full min-h-[52px] bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-sm focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Commencer le suivi
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6 text-balance">
          Tout reste sur cet appareil. Pas de compte, pas de cloud.
        </p>
      </div>
    </div>
  )
}
