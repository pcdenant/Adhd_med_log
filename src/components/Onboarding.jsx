import { useState } from 'react'

export default function Onboarding({ onSetup }) {
  const [medName, setMedName] = useState('')
  const [dosage, setDosage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSetup(medName.trim() || 'Non spécifié', dosage.trim() || 'Non spécifié')
  }

  return (
    <div className="min-h-screen bg-creme flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-vert-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💊</span>
          </div>
          <h1 className="text-2xl font-bold text-vert mb-2">Suivi Médicament TDAH</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Configurez votre cycle de 2 semaines.<br />
            Une saisie rapide par jour, un rapport clair pour votre médecin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du médicament
            </label>
            <input
              type="text"
              value={medName}
              onChange={e => setMedName(e.target.value)}
              placeholder="ex: Concerta, Ritaline, Vyvanse…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-vert focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dosage
            </label>
            <input
              type="text"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="ex: 20mg XR, 36mg, 40mg…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-vert focus:border-transparent transition-shadow"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-vert text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-vert-dark transition-colors shadow-sm"
          >
            Commencer le suivi →
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Données stockées localement · Aucun cloud · Aucun compte
        </p>
      </div>
    </div>
  )
}
