import { useState } from 'react'
import { PillIcon } from './icons.jsx'

export default function Onboarding({ onSetup }) {
  const [medName, setMedName] = useState('')
  const [dosage, setDosage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSetup(medName.trim() || 'Non spécifié', dosage.trim() || 'Non spécifié')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PillIcon className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-primary mb-2">Suivi Médicament TDAH</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Configurez votre cycle de 2 semaines.<br />
            Une saisie rapide par jour, un rapport clair pour votre médecin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="onboarding-med" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du médicament
            </label>
            <input
              id="onboarding-med"
              type="text"
              value={medName}
              onChange={e => setMedName(e.target.value)}
              placeholder="ex: Concerta, Ritaline, Vyvanse…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="onboarding-dosage" className="block text-sm font-medium text-gray-700 mb-1.5">
              Dosage
            </label>
            <input
              id="onboarding-dosage"
              type="text"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="ex: 20mg XR, 36mg, 40mg…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm"
          >
            Commencer le suivi →
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Données stockées localement · Aucun cloud · Aucun compte
        </p>
      </div>
    </div>
  )
}
