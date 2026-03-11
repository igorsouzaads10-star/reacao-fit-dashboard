'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, AGENDAMENTOS_TABLE, REGISTROS_TABLE } from '@/lib/supabase'
import type { AgendamentoComRegistro } from '@/types'

function mesAtual() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    inicio: `${y}-${m}-01`,
    fim: `${y}-${m}-${lastDay}`,
    nome: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  }
}

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function pct(a: number, b: number) {
  if (b === 0) return '—'
  return `${Math.round((a / b) * 100)}%`
}

interface MetaCardProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  cor?: string
  icon: string
}

function MetaCard({ titulo, valor, subtitulo, cor = 'text-white', icon }: MetaCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${cor}`}>{valor}</div>
      <div className="text-sm font-medium text-gray-300 mt-1">{titulo}</div>
      {subtitulo && <div className="text-xs text-gray-500 mt-0.5">{subtitulo}</div>}
    </div>
  )
}

export default function TabMetricas() {
  const [items, setItems] = useState<AgendamentoComRegistro[]>([])
  const [itemsHoje, setItemsHoje] = useState<AgendamentoComRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { inicio, fim } = mesAtual()
    const dataHoje = hoje()

    const [{ data: agend }, { data: agendHoje }] = await Promise.all([
      supabase.from(AGENDAMENTOS_TABLE).select('*').gte('dia_da_visita', inicio).lte('dia_da_visita', fim),
      supabase.from(AGENDAMENTOS_TABLE).select('*').eq('dia_da_visita', dataHoje),
    ])

    const todos = agend ?? []
    const todosHoje = agendHoje ?? []

    const ids = todos.map((a) => a.id)
    const idsHoje = todosHoje.map((a) => a.id)
    const allIds = [...new Set([...ids, ...idsHoje])]

    const { data: registros } = allIds.length
      ? await supabase.from(REGISTROS_TABLE).select('*').in('agendamento_id', allIds)
      : { data: [] }

    const merge = (list: typeof todos): AgendamentoComRegistro[] =>
      list.map((a) => ({
        ...a,
        registro: registros?.find((r) => r.agendamento_id === a.id) ?? null,
      }))

    setItems(merge(todos))
    setItemsHoje(merge(todosHoje))
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const totalMes = items.length
  const compareceramMes = items.filter((i) => i.registro?.compareceu).length
  const fechamentosMes = items.filter((i) => i.registro?.fechou_matricula).length

  const totalHoje = itemsHoje.length
  const compareceramHoje = itemsHoje.filter((i) => i.registro?.compareceu).length
  const fechamentosHoje = itemsHoje.filter((i) => i.registro?.fechou_matricula).length
  const naoVieramHoje = itemsHoje.filter((i) => i.registro && !i.registro.compareceu).length

  function gerarResumo() {
    const dataStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const fechados = itemsHoje.filter((i) => i.registro?.fechou_matricula)
    const detalhesFechados = fechados.length
      ? fechados
          .map((i) => `• ${i['primeiro-nome'] || i['nome-completo']}${i.registro?.plano_matricula ? ` (${i.registro.plano_matricula})` : ''}`)
          .join('\n')
      : '• Nenhum fechamento hoje'

    return `📅 Resumo do dia — ${dataStr}
👥 Agendados: ${totalHoje}
✅ Compareceram: ${compareceramHoje}
❌ Não vieram: ${naoVieramHoje}
💳 Fechamentos: ${fechamentosHoje}

📌 Detalhes:
${detalhesFechados}`
  }

  async function copiarResumo() {
    await navigator.clipboard.writeText(gerarResumo())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  const { nome: nomeMes } = mesAtual()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white capitalize">Métricas</h2>
        <p className="text-gray-400 text-sm mt-0.5 capitalize">{nomeMes}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* Métricas do mês */}
          <div className="mb-2">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Mês atual</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetaCard icon="📅" titulo="Total agendados" valor={totalMes} cor="text-white" />
              <MetaCard
                icon="✅"
                titulo="Comparecimento"
                valor={pct(compareceramMes, totalMes)}
                subtitulo={`${compareceramMes} de ${totalMes}`}
                cor="text-blue-400"
              />
              <MetaCard
                icon="💳"
                titulo="Fechamento"
                valor={pct(fechamentosMes, compareceramMes)}
                subtitulo={`${fechamentosMes} matrículas`}
                cor="text-emerald-400"
              />
            </div>
          </div>

          {/* Métricas de hoje */}
          {totalHoje > 0 && (
            <div className="mt-6 mb-2">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Hoje</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetaCard icon="📋" titulo="Agendados" valor={totalHoje} cor="text-white" />
                <MetaCard icon="✅" titulo="Compareceram" valor={compareceramHoje} cor="text-blue-400" />
                <MetaCard icon="❌" titulo="Não vieram" valor={naoVieramHoje} cor="text-red-400" />
                <MetaCard icon="💳" titulo="Matrículas" valor={fechamentosHoje} cor="text-emerald-400" />
              </div>
            </div>
          )}

          {/* Planos vendidos no mês */}
          {fechamentosMes > 0 && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Planos vendidos no mês</h3>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                {(() => {
                  const planosMap = new Map<string, number>()
                  for (const item of items) {
                    if (item.registro?.fechou_matricula) {
                      const p = item.registro.plano_matricula || 'Não informado'
                      planosMap.set(p, (planosMap.get(p) ?? 0) + 1)
                    }
                  }
                  return Array.from(planosMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([plano, count]) => (
                      <div key={plano} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-gray-300 text-sm">{plano}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 bg-emerald-500/30 rounded-full overflow-hidden w-20">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${(count / fechamentosMes) * 100}%` }}
                            />
                          </div>
                          <span className="text-emerald-400 font-semibold text-sm w-4 text-right">{count}</span>
                        </div>
                      </div>
                    ))
                })()}
              </div>
            </div>
          )}

          {/* Botão copiar resumo */}
          <div className="mt-8">
            <button
              onClick={copiarResumo}
              className={`w-full py-4 rounded-2xl border font-semibold text-base transition-all flex items-center justify-center gap-3 ${
                copiado
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {copiado ? '✅ Resumo copiado!' : '📋 Copiar resumo do dia'}
            </button>
            {!copiado && (
              <p className="text-xs text-gray-600 text-center mt-2">
                Gera texto formatado para o grupo do WhatsApp
              </p>
            )}
            {copiado && (
              <pre className="mt-4 text-xs text-gray-400 bg-white/[0.03] border border-white/10 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
                {gerarResumo()}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  )
}
