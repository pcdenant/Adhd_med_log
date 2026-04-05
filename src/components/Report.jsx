import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  getEntriesLast14Days,
  calculateWearOffTimeline,
  calculateDimensionAverages,
  calculateDayOfWeekPattern,
  calculateSideEffectFrequency,
  estimateCoverageHours,
} from '../utils/calculations.js'

// ── Colour helpers ────────────────────────────────────────────────────────────

function dimColor(avg) {
  if (avg == null) return '#d1d5db'
  if (avg < 2.5) return '#ef4444'
  if (avg < 3.5) return '#f59e0b'
  return '#22c55e'
}

function wearOffColor(avg) {
  if (avg <= 1.2) return '#22c55e'
  if (avg <= 1.6) return '#84cc16'
  if (avg <= 2.2) return '#f59e0b'
  return '#ef4444'
}

function heatClass(norm) {
  if (norm == null) return 'bg-gray-100 text-gray-400'
  if (norm >= 0.65) return 'bg-green-100 text-green-800'
  if (norm >= 0.35) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Section A: Wear-off timeline ──────────────────────────────────────────────

function WearOffSection({ entries }) {
  const data = useMemo(() => calculateWearOffTimeline(entries), [entries])

  if (!data.length) {
    return (
      <EmptyState text="Données insuffisantes — assurez-vous de saisir l'heure de prise et le niveau d'essoufflement." />
    )
  }

  const labelFor = (v) => {
    if (v <= 1.2) return '✅ Pleinement actif'
    if (v <= 1.9) return '🟡 Essoufflement léger'
    return '🔴 Essoufflement fort'
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            domain={[0, 3]}
            ticks={[1, 2, 3]}
            tickFormatter={v => ({ 1: 'Aucun', 2: 'Léger', 3: 'Fort' }[v] ?? '')}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(v) => [
              { 1: 'Aucun essoufflement', 2: 'Essoufflement léger', 3: 'Essoufflement fort' }[Math.round(v)] ?? v,
              'Niveau moyen',
            ]}
          />
          <Bar dataKey="avgWearOff" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={wearOffColor(d.avgWearOff)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-1">
        {data.map(d => (
          <div key={d.label} className="flex items-center justify-between text-xs">
            <span className="font-mono text-gray-500 w-14">{d.label}</span>
            <span className="flex-1 mx-2">{labelFor(d.avgWearOff)}</span>
            <span className="text-gray-400">{d.total} obs.</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section B: Dimension averages ─────────────────────────────────────────────

function DimensionSection({ entries }) {
  const data = useMemo(() => calculateDimensionAverages(entries), [entries])
  const sorted = [...data].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))
  const challenges = sorted.filter(d => d.avg != null && d.avg < 2.5)

  const chartData = sorted.map(d => ({
    label: d.label,
    avg: d.avg,
    fill: dimColor(d.avg),
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v?.toFixed(1)} / 5`, 'Moyenne']} />
          <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &lt; 2.5 défi persistant</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> 2.5–3.5 modéré</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> &gt; 3.5 bon</span>
      </div>

      {challenges.length > 0 && (
        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Défis persistants (moy. &lt; 2.5)</p>
          {challenges.map(d => (
            <p key={d.key} className="text-xs text-red-600">
              • {d.label} —{' '}
              <span className="font-mono font-semibold">{d.avg?.toFixed(1)}/5</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section C: Day-of-week heatmap ───────────────────────────────────────────

function DayOfWeekSection({ entries }) {
  const allDays = useMemo(() => calculateDayOfWeekPattern(entries), [entries])

  // European order: Mon→Sun (indices 1–6, then 0)
  const ordered = [1, 2, 3, 4, 5, 6, 0].map(i => allDays[i])
  const withData = ordered.filter(d => d.avg != null)

  if (!withData.length) return <EmptyState text="Pas encore assez de données." />

  const max = Math.max(...withData.map(d => d.avg))
  const min = Math.min(...withData.map(d => d.avg))

  const norm = (avg) => {
    if (avg == null) return null
    return max === min ? 0.5 : (avg - min) / (max - min)
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {ordered.map(d => (
        <div
          key={d.day}
          className={`rounded-xl py-3 px-1 text-center ${heatClass(norm(d.avg))}`}
        >
          <div className="text-xs font-bold">{d.label}</div>
          <div className="font-mono text-base font-bold mt-1">
            {d.avg != null ? d.avg.toFixed(1) : '—'}
          </div>
          <div className="text-xs opacity-50 mt-0.5">{d.count > 0 ? `${d.count}j` : ''}</div>
        </div>
      ))}
    </div>
  )
}

// ── Section D: Side effect frequency ─────────────────────────────────────────

function SideEffectSection({ entries }) {
  const data = useMemo(() => calculateSideEffectFrequency(entries), [entries])
  const active = data.filter(se => se.count > 0).sort((a, b) => b.count - a.count)

  if (!active.length) {
    return (
      <div className="text-center py-5">
        <span className="text-green-600 text-sm">✅ Aucun effet secondaire rapporté sur la période.</span>
      </div>
    )
  }

  const chartData = active.map(se => ({
    label: se.label.length > 22 ? se.label.slice(0, 22) + '…' : se.label,
    fullLabel: se.label,
    count: se.count,
    pct: se.pct,
    trend: se.trend,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(140, active.length * 38)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" domain={[0, 14]} ticks={[0, 7, 14]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v, _, props) => [
              `${v} jours (${props.payload.pct}%)`,
              props.payload.fullLabel,
            ]}
          />
          <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-1.5">
        {active.map(se => (
          <div key={se.key} className="flex items-center justify-between text-xs text-gray-600">
            <span className="flex-1 truncate mr-2">{se.label}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono">{se.count}/14</span>
              {se.trend === 'increasing' && (
                <span className="text-red-500 font-medium">↑ hausse</span>
              )}
              {se.trend === 'decreasing' && (
                <span className="text-green-500 font-medium">↓ baisse</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section E: Narrative synthesis ───────────────────────────────────────────

function NarrativeSection({ cycle, entries, dimAvgs, wearOffData, sideEffects, dayPattern }) {
  const coverage = estimateCoverageHours(wearOffData)
  const sorted = [...dimAvgs].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))
  const topDims = sorted.filter(d => d.avg != null && d.avg >= 3.5).slice(0, 3)
  const challenges = sorted.filter(d => d.avg != null && d.avg < 2.5)

  // European order, filter to days with data
  const orderedDays = [1, 2, 3, 4, 5, 6, 0].map(i => dayPattern[i])
  const withDayData = orderedDays.filter(d => d.avg != null && d.count > 0)
  const hardestDay =
    withDayData.length > 0
      ? withDayData.reduce((a, b) => (a.avg ?? 5) < (b.avg ?? 5) ? a : b)
      : null

  const activeSE = sideEffects.filter(se => se.count > 0).sort((a, b) => b.count - a.count)
  const worsening = activeSE.filter(se => se.trend === 'increasing')

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-5">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
          Bilan de maintenance médicamenteuse
        </p>
        <p className="font-mono font-bold text-gray-800 text-sm">
          {cycle.medicationName} · {cycle.dosage}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {entries.length} saisie{entries.length > 1 ? 's' : ''} ·{' '}
          {formatDate(cycle.cycleStartDate)} → {formatDate(new Date().toISOString().split('T')[0])}
        </p>
      </div>

      {/* Coverage */}
      <NarrativeBlock
        color="text-vert"
        title="⏱ Efficacité temporelle"
        content={
          coverage != null ? (
            <p>
              Couverture fiable estimée à environ{' '}
              <strong className="font-mono">{coverage}h</strong> après la prise.
              {coverage <= 5
                ? " Durée courte — à discuter avec le médecin."
                : coverage >= 8
                ? " Bonne durée de couverture journalière."
                : " Durée standard."}
            </p>
          ) : (
            <p className="italic text-gray-400">
              Données insuffisantes pour calculer la durée d'efficacité.
            </p>
          )
        }
      />

      {/* Top dimensions */}
      {topDims.length > 0 && (
        <NarrativeBlock
          color="text-green-700"
          title="✅ Ce qui fonctionne bien"
          content={topDims.map(d => (
            <p key={d.key}>
              • {d.label} —{' '}
              <strong className="font-mono">{d.avg?.toFixed(1)}/5</strong>
              {' '}— nettement amélioré par le médicament
            </p>
          ))}
        />
      )}

      {/* Challenges */}
      {challenges.length > 0 && (
        <NarrativeBlock
          color="text-red-700"
          title="⚠️ Défis persistants"
          content={challenges.map(d => (
            <p key={d.key}>
              • {d.label} —{' '}
              <strong className="font-mono">{d.avg?.toFixed(1)}/5</strong>
              {' '}— reste difficile même sous médicament
            </p>
          ))}
        />
      )}

      {/* Day pattern */}
      {hardestDay && (
        <NarrativeBlock
          color="text-orange-700"
          title="📅 Pattern hebdomadaire"
          content={
            <p>
              Le <strong>{hardestDay.fullLabel}</strong> est systématiquement le jour le plus
              difficile (moy.{' '}
              <span className="font-mono">{hardestDay.avg?.toFixed(1)}/5</span>). À mentionner au
              médecin.
            </p>
          }
        />
      )}

      {/* Side effects */}
      {activeSE.length > 0 && (
        <NarrativeBlock
          color="text-orange-700"
          title="⚠️ Effets secondaires"
          content={
            <>
              {activeSE.slice(0, 4).map(se => (
                <p key={se.key}>
                  • {se.label} —{' '}
                  <span className="font-mono">{se.count}/14 jours ({se.pct}%)</span>
                  {se.trend === 'increasing' && (
                    <span className="text-red-500 font-medium"> ↑ en hausse</span>
                  )}
                  {se.trend === 'decreasing' && (
                    <span className="text-green-600 font-medium"> ↓ en baisse</span>
                  )}
                </p>
              ))}
              {worsening.length > 0 && (
                <p className="text-red-600 font-semibold mt-1">
                  ⚠️ En hausse : {worsening.map(s => s.label).join(', ')}
                </p>
              )}
            </>
          }
        />
      )}

      {/* Discussion points */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Points à discuter avec le médecin
        </p>
        <div className="space-y-1 text-xs text-gray-600 font-mono">
          <p>☐ Continuer le dosage actuel ?</p>
          <p>☐ Ajuster l'horaire de prise ?</p>
          {challenges.length > 0 && (
            <p>☐ Stratégie pour : {challenges.map(d => d.label).join(', ')} ?</p>
          )}
          {worsening.length > 0 && (
            <p>☐ Effet secondaire croissant : {worsening.map(s => s.label).join(', ')} ?</p>
          )}
          <p>☐ Modifier la molécule ou la formulation ?</p>
        </div>
      </div>
    </div>
  )
}

function NarrativeBlock({ color, title, content }) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${color}`}>{title}</p>
      <div className="text-xs text-gray-700 space-y-0.5 leading-relaxed">{content}</div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ text }) {
  return (
    <p className="text-gray-400 text-sm italic text-center py-4">{text}</p>
  )
}

// ── Main Report component ─────────────────────────────────────────────────────

export default function Report({ entries, cycle, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false)

  const recent = useMemo(() => getEntriesLast14Days(entries), [entries])
  const hasEnough = recent.length >= 10

  const dimAvgs = useMemo(() => calculateDimensionAverages(recent), [recent])
  const wearOffData = useMemo(() => calculateWearOffTimeline(recent), [recent])
  const sideEffects = useMemo(() => calculateSideEffectFrequency(recent), [recent])
  const dayPattern = useMemo(() => calculateDayOfWeekPattern(recent), [recent])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Rapport 2 semaines</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {recent.length} saisie{recent.length !== 1 ? 's' : ''} sur les 14 derniers jours
            {!hasEnough && (
              <span className="text-orange-500">
                {' '}· encore {10 - recent.length} nécessaire{10 - recent.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {!hasEnough && (
          <div className="text-right flex-shrink-0">
            <div className="font-mono text-2xl font-bold text-gray-300 leading-none">
              {recent.length}<span className="text-base">/10</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">min. requis</div>
          </div>
        )}
      </div>

      {/* Not enough data */}
      {!hasEnough ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-600 text-sm mb-1">
            Il faut au moins <strong>10 saisies</strong> sur 14 jours pour générer le rapport.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Vous en avez <strong className="font-mono">{recent.length}</strong>. Encore{' '}
            <strong>{10 - recent.length}</strong> à faire !
          </p>
          {/* Progress bar */}
          <div className="max-w-xs mx-auto bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-vert h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (recent.length / 10) * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <ReportSection
            letter="A"
            title="Timeline d'efficacité — essoufflement"
            subtitle="Heures après la prise → niveau moyen d'essoufflement"
          >
            <WearOffSection entries={recent} />
          </ReportSection>

          <ReportSection
            letter="B"
            title="Performance par dimension (Brown)"
            subtitle="Moyenne 14 jours · Rouge < 2.5 · Jaune 2.5–3.5 · Vert > 3.5"
          >
            <DimensionSection entries={recent} />
          </ReportSection>

          <ReportSection
            letter="C"
            title="Pattern jour de la semaine"
            subtitle="Score composite moyen (6 dimensions) · Rouge = jour difficile"
          >
            <DayOfWeekSection entries={recent} />
          </ReportSection>

          <ReportSection
            letter="D"
            title="Fréquence des effets secondaires"
            subtitle="Nombre de jours rapportés sur 14 · ↑ = tendance croissante"
          >
            <SideEffectSection entries={recent} />
          </ReportSection>

          <ReportSection
            letter="E"
            title="Synthèse narrative"
            subtitle="Résumé pour votre médecin"
          >
            <NarrativeSection
              cycle={cycle}
              entries={recent}
              dimAvgs={dimAvgs}
              wearOffData={wearOffData}
              sideEffects={sideEffects}
              dayPattern={dayPattern}
            />
          </ReportSection>
        </div>
      )}

      {/* Reset cycle */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        {confirmReset ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium mb-3">
              ⚠️ Toutes les saisies seront effacées de façon irréversible. Le nom du médicament et
              le dosage seront conservés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { onReset(); setConfirmReset(false) }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Oui, réinitialiser
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
          >
            Réinitialiser et démarrer un nouveau cycle
          </button>
        )}
      </div>
    </div>
  )
}

function ReportSection({ letter, title, subtitle, children }) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono font-bold text-vert text-sm bg-vert-light px-2 py-0.5 rounded">
          {letter}
        </span>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
      {children}
    </section>
  )
}
