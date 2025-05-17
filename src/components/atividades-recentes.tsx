import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Clock, LogIn, LogOut, Users, ClapperboardIcon } from "lucide-react";

export default async function AtividadesRecentes() {
  const supabase = createServerSupabaseClient();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);


  // --- Buscar últimos 5 check-ins ---
  const { data: checkins } = await supabase
    .from("checkins")
    .select(
      "id, horario, checkout_horario, crianca_id, responsavel_id, checkout_responsavel_id, turma_id"
    )
    .order("horario", { ascending: false })
    .limit(5);

  const atividades: {
    id: string;
    tipo: "checkin" | "checkout";
    horario: string;
    crianca: { id: string; nome: string };
    turma: { id: string; nome: string };
    responsavel: { id: string; nome: string };
  }[] = [];

  if (checkins) {
    for (const checkin of checkins) {
      const [criancaRes, turmaRes, respCheckinRes, respCheckoutRes] =
        await Promise.all([
          supabase
            .from("criancas")
            .select("id, nome")
            .eq("id", checkin.crianca_id)
            .single(),
          supabase
            .from("turmas")
            .select("id, nome")
            .eq("id", checkin.turma_id)
            .single(),
          supabase
            .from("responsaveis")
            .select("id, nome")
            .eq("id", checkin.responsavel_id)
            .single(),
          checkin.checkout_responsavel_id
            ? supabase
                .from("responsaveis")
                .select("id, nome")
                .eq("id", checkin.checkout_responsavel_id)
                .single()
            : Promise.resolve({ data: null }),
        ]);

      const crianca = criancaRes.data;
      const turma = turmaRes.data;
      const responsavelCheckin = respCheckinRes.data;
      const responsavelCheckout = respCheckoutRes.data;

      if (crianca && turma && responsavelCheckin) {
        atividades.push({
          id: `${checkin.id}-checkin`,
          tipo: "checkin",
          horario: checkin.horario,
          crianca,
          turma,
          responsavel: responsavelCheckin,
        });
      }

      if (checkin.checkout_horario && responsavelCheckout && crianca && turma) {
        atividades.push({
          id: `${checkin.id}-checkout`,
          tipo: "checkout",
          horario: checkin.checkout_horario,
          crianca,
          turma,
          responsavel: responsavelCheckout,
        });
      }
    }
  }

  // Ordenar por horário mais recente
  atividades.sort(
    (a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime()
  );

  return (
    <div className="grid gap-4">

      {/* Atividade recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas entradas e saídas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {atividades.slice(0, 5).map((atividade) => (
              <div
                key={atividade.id}
                className="flex items-center gap-4 border-b pb-4 last:border-0"
              >
                <div
                  className={`rounded-full p-2 ${
                    atividade.tipo === "checkin"
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-blue-100 dark:bg-blue-900"
                  }`}
                >
                  {atividade.tipo === "checkin" ? (
                    <LogIn className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <LogOut className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {atividade.tipo === "checkin" ? "Check-in" : "Check-out"}:{" "}
                    {atividade.crianca.nome}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Turma: {atividade.turma.nome} <br />
                    Responsável: {atividade.responsavel.nome}
                  </p>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {new Date(atividade.horario).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
