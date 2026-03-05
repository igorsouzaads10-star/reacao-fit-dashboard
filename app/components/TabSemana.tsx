'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, AGENDAMENTOS_TABLE, REGISTROS_TABLE } from '@/lib/supabase'
import type { AgendamentoComRegistro } from '@/types'
import CartaoAgendamento from './CartaoAgendamento'

function dataLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function semanaAtual() {
  const now = new Date()
  const dow = now.getDay() // 0=Dom
  const segunda = new Date(now)
  segunda.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  const domingo = new Date(segunda)
  domingo.setDate(segunda.getDate() + 6)
  return {
    inicio: dataLocal(segunda),
    fim: dataLocal(domingo),
  }
}

function nomeDia(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const hoje = dataLocal(new Date())
  if (dateStr === hoje) return 'Hoje'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

export default function TabSemana() {
  const [grupos, setGrupos] = useState<{ data: string; items: AgendamentoComRegistro[] }[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { inicio, fim } = semanaAtual()

    const { data: agendamentos } = await supabase
      .from(AGENDAMENTOS_TABLE)
      .select('*')
      .gte('dia-da-visita', inicio)
      .lte('dia-da-visita', fim)
      .order('dia-da-visita')

    if (!agendamentos) {
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

    // Agrupar por dia
    const map = new Map<string, AgendamentoComRegistro[]>()
    for (const item of merged) {
      const dia = item['dia-da-visita'] ?? 'sem-data'
      if (!map.has(dia)) map.set(dia, [])
      map.get(dia)!.push(item)
    }

    const grupados = Array.from(map.entries()).map(([data, items]) => ({ data, items }))
    setGrupos(grupados)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const { inicio, fim } = semanaAtual()
  const periodoStr = `${new Date(inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – ${new Date(fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

  const totalSemana = grupos.reduce((s, g) => s + g.items.length, 0)
  const compareceram = grupos.reduce((s, g) => s + g.items.filter((i) => i.registro?.compareceu).length, 0)
  const fechamentos = grupos.reduce((s, g) => s + g.items.filter((i) => i.registro?.fechou_matricula).length, 0)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Esta semana</h2>
        <p className="text-gray-400 text-sm mt-0.5">{periodoStr}</p>
      </div>

      {!loading && totalSemana > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Agendados', value: totalSemana, color: 'text-white' },
            { label: 'Compareceram', value: compareceram, color: 'text-blue-400' },
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

      {!loading && grupos.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📆</div>
          <p className="font-medium text-gray-400">Nenhum agendamento esta semana</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {grupos.map(({ data, items }) => {
            const hojeStr = dataLocal(new Date())
            const isHoje = data === hojeStr
            return (
              <div key={data}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className={`font-semibold capitalize ${isHoje ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {nomeDia(data)}
                  </h3>
                  {isHoje && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      hoje
                    </span>
                  )}
                  <span className="text-xs text-gray-600">{items.length} agendado{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3 pl-0">
                  {items.map((item) => (
                    <CartaoAgendamento key={item.id} item={item} onUpdated={carregar} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
