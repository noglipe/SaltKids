export interface Responsavel {
  id: string
  nome: string
  cpf: string
  telefone: string
  foto_url?: string
  created_at: string
  updated_at: string
  cpf_hash: string
}

export interface Crianca {
  id: string
  nome: string
  data_nascimento: string
  observacoes?: string
  foto_url?: string
  turma_id?: string
  created_at: string
  updated_at: string
}

export interface Turma {
  id: string
  nome: string
  faixa_etaria: string
  capacidade: number
  sala: string
  descricao?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface Professor {
  id: string
  nome: string
  telefone: string
  data_nascimento?: string
  foto_url?: string
  created_at: string
  updated_at: string
}

export interface CriancaResponsavel {
  id: string
  crianca_id: string
  responsavel_id: string
  parentesco: string
  created_at: string
}

export interface ProfessorTurma {
  id: string
  professor_id: string
  turma_id: string
  created_at: string
}

export interface Checkin {
  id: string
  crianca_id: string
  responsavel_id: string
  turma_id: string
  horario: string
  checkout_horario?: string
  checkout_responsavel_id?: string
  status: "ativo" | "finalizado"
  created_at: string
}

export interface CriancaComTurma extends Crianca {
  turma?: Turma
}

export interface CriancaComResponsaveis extends Crianca {
  responsaveis: (Responsavel & { parentesco: string })[]
}

export interface ResponsavelComCriancas extends Responsavel {
  criancas: (Crianca & { parentesco: string })[]
}

export interface TurmaComProfessores extends Turma {
  professores: Professor[]
}

export interface ProfessorComTurmas extends Professor {
  turmas: Turma[]
}
