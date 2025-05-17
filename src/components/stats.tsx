// app/components/Stats.tsx ou equivalente (sem 'use client')
import { LogIn, Users, ClapperboardIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Stats() {
  const supabase = createServerSupabaseClient();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Busca crianças presentes (sem checkout)
  const { count: criancasPresentes } = await supabase
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo");

  // Busca turmas ativas
  const { count: turmasAtivas } = await supabase
    .from("turmas")
    .select("*", { count: "exact", head: true });

  // Busca check-ins de hoje
  const { count: checkinsHoje } = await supabase
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .gte("horario", hoje.toISOString());

  const stats = [
    {
      label: "Crianças presentes",
      value: criancasPresentes ?? 0,
      icon: Users,
    },
    {
      label: "Turmas ativas",
      value: turmasAtivas ?? 0,
      icon: ClapperboardIcon,
    },
    {
      label: "Check-ins hoje",
      value: checkinsHoje ?? 0,
      icon: LogIn,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-4 grid-cols-3 ">
        {stats.map((stat, index) => (
          <div key={index} className="p-2">
            <CardContent className="flex items-center gap-4 p-2 sm:p-6">
              <div className="rounded-full p-2 bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </div>
        ))}
      </div>
    </div>
  );
}
