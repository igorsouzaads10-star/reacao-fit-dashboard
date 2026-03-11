export interface Agendamento {
  id: number
  'primeiro-nome': string | null
  'nome-completo': string
  telefone: string | null
  'dia_da_visita': string | null
  status: string
  'resumo-atendimento-ia': string | null
}

export interface Registro {
  id: number
  agendamento_id: number
  compareceu: boolean
  fechou_matricula: boolean
  plano_matricula: string | null
  registrado_em: string
  registrado_por: string | null
}

export interface AgendamentoComRegistro extends Agendamento {
  registro?: Registro | null
}
