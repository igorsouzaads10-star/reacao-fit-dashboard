'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import TabHoje from './components/TabHoje'
import TabSemana from './components/TabSemana'
import TabMetricas from './components/TabMetricas'

type Tab = 'hoje' | 'semana' | 'metricas'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: '📅' },
  { id: 'semana', label: 'Semana', icon: '📆' },
  { id: 'metricas', label: 'Métricas', icon: '📊' },
]

export default function Home() {
  const [aba, setAba] = useState<Tab>('hoje')

  return (
    <div className="min-h-screen" style={{ background: '#0f0f12' }}>
      {/* Header */}
      <header className="border-b border-white/[0.06] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-base">
            💪
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">Reação Fit</h1>
            <p className="text-xs text-gray-500">Visitas experimentais</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/[0.06] px-4">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                aba === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {aba === 'hoje' && <TabHoje />}
        {aba === 'semana' && <TabSemana />}
        {aba === 'metricas' && <TabMetricas />}
      </main>
    </div>
  )
}
