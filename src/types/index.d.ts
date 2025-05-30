type CheckinComRelacionamentos = {
  id: string;
  status: string;
  checkout_horario: string | null;
  criancas: { nome: string } | null;
  turmas: { nome: string } | null;
};

interface Checkin {
  id: string;
  crianca_id: string;
  turma_id: string;
  horario: string;
  checkout_horario: string | null;
  status: string | null;
  criancas: Crianca;
  turmas: Turma;
}