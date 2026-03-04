'use client'

import { useState } from 'react'
import { supabase, REGISTROS_TABLE } from '@/lib/supabase'
import type { AgendamentoComRegistro } from '@/types'
import RegistroModal from './RegistroModal'

interface Props {
  item: AgendamentoComRegistro
  onUpdated: () => void
  showDate?: boolean
}

export default function CartaoAgendamento({ item, onUpdated, showDate }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const reg = item.registro
  const estado = !reg ? 'pendente' : reg.fechou_matricula ? 'fechou' : reg.compareceu ? 'compareceu' : 'naoveio'

  async function marcarNaoVeio() {
    setLoading(true)
    try {
      if (reg?.id) {
        await supabase
          .from(REGISTROS_TABLE)
          .update({ compareceu: false, fechou_matricula: false, plano_matricula: null })
          .eq('id', reg.id)
      } else {
        await supabase.from(REGISTROS_TABLE).insert({
          agendamento_id: item.id,
          compareceu: false,
          fechou_matricula: false,
        })
      }
      onUpdated()
    } finally {
      setLoading(false)
    }
  }

  async function desfazer() {
    if (!reg?.id) return
    setLoading(true)
    try {
      await supabase.from(REGISTROS_TABLE).delete().eq('id', reg.id)
      onUpdated()
    } finally {
      setLoading(false)
    }
  }

  const dataFormatada = item['dia-da-visita']
    ? new Date(item['dia-da-visita'] + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      })
    : null

  const cardStyle = {
    pendente: 'bg-white/[0.03] border-white/10 hover:border-white/20',
    compareceu: 'bg-blue-500/5 border-blue-500/20',
    fechou: 'bg-emerald-500/5 border-emerald-500/20',
    naoveio: 'bg-red-500/5 border-red-500/20',
  }[estado]

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-all ${cardStyle}`}>
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">
                {item['primeiro-nome'] || item['nome-completo']}
              </h3>
              {showDate && dataFormatada && (
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                  {dataFormatada}
                </span>
              )}
            </div>
            {item['nome-completo'] !== item['primeiro-nome'] && (
              <p className="text-sm text-gray-400 mt-0.5">{item['nome-completo']}</p>
            )}
            {item['resumo-atendimento-ia'] && (
              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                {item['resumo-atendimento-ia']}
              </p>
            )}
          </div>

          {/* Badge de status + botão desfazer */}
          {estado !== 'pendente' && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {estado === 'fechou' && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                  💳 {reg?.plano_matricula || 'Matriculado'}
                </span>
              )}
              {estado === 'compareceu' && (
                <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full font-medium">
                  ✅ Compareceu
                </span>
              )}
              {estado === 'naoveio' && (
                <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full font-medium">
                  ❌ Não veio
                </span>
              )}
              {reg?.registrado_por && (
                <span className="text-xs text-gray-600">por {reg.registrado_por}</span>
              )}
            </div>
          )}
        </div>

        {/* Ações primárias — estado pendente */}
        {estado === 'pendente' && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowModal(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-sm font-medium transition-all disabled:opacity-50"
            >
              ✅ Compareceu
            </button>
            <button
              onClick={marcarNaoVeio}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-sm font-medium transition-all disabled:opacity-50"
            >
              ❌ Não veio
            </button>
          </div>
        )}

        {/* Ações secundárias — estado registrado */}
        {estado !== 'pendente' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            {/* Alterar para compareceu (se estava como não veio) */}
            {estado === 'naoveio' && (
              <button
                onClick={() => setShowModal(true)}
                disabled={loading}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium transition-all disabled:opacity-50"
              >
                ✅ Compareceu
              </button>
            )}

            {/* Editar (se compareceu ou fechou) */}
            {(estado === 'compareceu' || estado === 'fechou') && (
              <button
                onClick={() => setShowModal(true)}
                disabled={loading}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium transition-all disabled:opacity-50"
              >
                ✏️ Editar
              </button>
            )}

            {/* Marcar como não veio (se compareceu ou fechou) */}
            {(estado === 'compareceu' || estado === 'fechou') && (
              <button
                onClick={marcarNaoVeio}
                disabled={loading}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-all disabled:opacity-50"
              >
                ❌ Não veio
              </button>
            )}

            {/* Desfazer — sempre disponível quando há registro */}
            <button
              onClick={desfazer}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-500 hover:text-gray-300 text-xs font-medium transition-all disabled:opacity-50"
            >
              ↩ Desfazer
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <RegistroModal
          agendamento={item}
          onClose={() => setShowModal(false)}
          onSaved={onUpdated}
        />
      )}
    </>
  )
}
