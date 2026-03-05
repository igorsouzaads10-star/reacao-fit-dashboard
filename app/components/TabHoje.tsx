'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, AGENDAMENTOS_TABLE, REGISTROS_TABLE } from '@/lib/supabase'
import type { AgendamentoComRegistro } from '@/types'
import CartaoAgendamento from './CartaoAgendamento'

function hoje() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function TabHoje() {
  const [items, setItems] = useState<AgendamentoComRegistro[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const data = hoje()

    const { data: agendamentos, error: err1 } = await supabase
      .from(AGENDAMENTOS_TABLE)
      .select('*')
      .eq('dia-da-visita', data)
      .order('id')

    if (err1 || !agendamentos) {
      setLoading(false)
      return
    }

    const ids = agendamentos.map((a) => a.id)
    const { data: registros } = ids.length
      ? await supabase.from(REGISTROS_TABLE).select('*').in('agendamento_id', ids)
      : { data: [] }

    const merged: AgendamentoComRegistro[] = agendamentos.map((a) => ({
      ...a,
      registro: registros?.find((r) => r.agendamento_id === a.id) ?? null,
    }))

    setItems(merged)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const compareceram = items.filter((i) => i.registro?.compareceu).length
  const naoVieram = items.filter((i) => i.registro && !i.registro.compareceu).length
  const pendentes = items.filter((i) => !i.registro).length
  const fechamentos = items.filter((i) => i.registro?.fechou_matricula).length

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white capitalize">{dataHoje}</h2>
        <p className="text-gray-400 text-sm mt-0.5">Agendamentos do dia</p>
      </div>

      {/* Estatísticas rápidas */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Agendados', value: items.length, color: 'text-white' },
            { label: 'Compareceram', value: compareceram, color: 'text-blue-400' },
            { label: 'Não vieram', value: naoVieram, color: 'text-red-400' },
            { label: 'Matrículas', value: fechamentos, color: 'text-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-medium text-gray-400">Nenhum agendamento para hoje</p>
          <p className="text-sm mt-1">Os agendamentos aparecerão aqui quando houver visitas marcadas.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {pendentes > 0 && (
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              {pendentes} pendente{pendentes > 1 ? 's' : ''}
            </p>
          )}
          {items
            .sort((a, b) => {
              // Pendentes primeiro
              const aPend = !a.registro ? 0 : 1
              const bPend = !b.registro ? 0 : 1
              return aPend - bPend
            })
            .map((item) => (
              <CartaoAgendamento key={item.id} item={item} onUpdated={carregar} />
            ))}
        </div>
      )}
    </div>
  )
}
