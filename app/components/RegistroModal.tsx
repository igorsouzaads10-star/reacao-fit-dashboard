'use client'

import { useState } from 'react'
import { supabase, REGISTROS_TABLE } from '@/lib/supabase'
import type { AgendamentoComRegistro } from '@/types'

const PLANOS = ['Mensal', 'Trimestral', 'Semestral', 'Anual']

interface Props {
  agendamento: AgendamentoComRegistro
  onClose: () => void
  onSaved: () => void
}

export default function RegistroModal({ agendamento, onClose, onSaved }: Props) {
  const [fechouMatricula, setFechouMatricula] = useState(agendamento.registro?.fechou_matricula ?? false)
  const [plano, setPlano] = useState(agendamento.registro?.plano_matricula ?? '')
  const [registradoPor, setRegistradoPor] = useState(agendamento.registro?.registrado_por ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function salvar() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        agendamento_id: agendamento.id,
        compareceu: true,
        fechou_matricula: fechouMatricula,
        plano_matricula: fechouMatricula ? plano || null : null,
        registrado_por: registradoPor || null,
      }

      if (agendamento.registro?.id) {
        const { error: err } = await supabase
          .from(REGISTROS_TABLE)
          .update(payload)
          .eq('id', agendamento.registro.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from(REGISTROS_TABLE)
          .insert(payload)
        if (err) throw err
      }

      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1a1a24] border border-white/10 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {agendamento['primeiro-nome'] || agendamento['nome-completo']}
            </h2>
            <p className="text-sm text-gray-400">Registrar comparecimento</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 text-xl">✅</span>
            <span className="text-emerald-300 font-medium">Marcado como compareceu</span>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setFechouMatricula(!fechouMatricula)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  fechouMatricula ? 'bg-emerald-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  fechouMatricula ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-white">Fechou matrícula?</span>
            </label>
          </div>

          {fechouMatricula && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Plano escolhido</label>
              <div className="grid grid-cols-2 gap-2">
                {PLANOS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlano(p)}
                    className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${
                      plano === p
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-white/10 text-gray-300 hover:border-emerald-500/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                placeholder="Ou digite outro plano..."
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Registrado por (opcional)</label>
            <input
              type="text"
              value={registradoPor}
              onChange={(e) => setRegistradoPor(e.target.value)}
              placeholder="Seu nome..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition-all text-sm disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
