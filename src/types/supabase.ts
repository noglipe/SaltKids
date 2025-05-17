export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      checkins: {
        Row: {
          id: string
          crianca_id: string
          responsavel_id: string
          turma_id: string
          horario: string
          checkout_horario: string | null
          checkout_responsavel_id: string | null
          checkout_responsavel_nome: string | null
          checkout_forcado: boolean | null
          checkout_forcado_motivo: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          crianca_id: string
          responsavel_id: string
          turma_id: string
          horario?: string
          checkout_horario?: string | null
          checkout_responsavel_id?: string | null
          checkout_responsavel_nome?: string | null
          checkout_forcado?: boolean | null
          checkout_forcado_motivo?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          crianca_id?: string
          responsavel_id?: string
          turma_id?: string
          horario?: string
          checkout_horario?: string | null
          checkout_responsavel_id?: string | null
          checkout_responsavel_nome?: string | null
          checkout_forcado?: boolean | null
          checkout_forcado_motivo?: string | null
          status?: string
          created_at?: string
        }
      }
      crianca_responsavel: {
        Row: {
          id: string
          crianca_id: string
          responsavel_id: string
          parentesco: string
          created_at: string
        }
        Insert: {
          id?: string
          crianca_id: string
          responsavel_id: string
          parentesco: string
          created_at?: string
        }
        Update: {
          id?: string
          crianca_id?: string
          responsavel_id?: string
          parentesco?: string
          created_at?: string
        }
      }
      criancas: {
        Row: {
          id: string
          nome: string
          data_nascimento: string
          observacoes: string | null
          foto_url: string | null
          turma_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          data_nascimento: string
          observacoes?: string | null
          foto_url?: string | null
          turma_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          data_nascimento?: string
          observacoes?: string | null
          foto_url?: string | null
          turma_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      professor_turma: {
        Row: {
          id: string
          professor_id: string
          turma_id: string
          created_at: string
        }
        Insert: {
          id?: string
          professor_id: string
          turma_id: string
          created_at?: string
        }
        Update: {
          id?: string
          professor_id?: string
          turma_id?: string
          created_at?: string
        }
      }
      professores: {
        Row: {
          id: string
          nome: string
          telefone: string
          data_nascimento: string | null
          foto_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          data_nascimento?: string | null
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          data_nascimento?: string | null
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      responsaveis: {
        Row: {
          id: string
          nome: string
          cpf: string
          telefone: string
          foto_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          telefone: string
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          telefone?: string
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      turmas: {
        Row: {
          id: string
          nome: string
          faixa_etaria: string
          capacidade: number
          sala: string
          descricao: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          faixa_etaria: string
          capacidade: number
          sala: string
          descricao?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          faixa_etaria?: string
          capacidade?: number
          sala?: string
          descricao?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
