import Link from "next/link";
import { UserPlus, Users, School, UserCheck, Settings2, Settings, MousePointer, MousePointerBan, MousePointerSquareDashed } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MainLayout from "@/components/main-layout";

export default function CadastroPage() {
  const cadastroOptions = [
    {
      title: "Cadastro de Criança",
      description: "Adicionar nova criança ao sistema",
      icon: UserPlus,
      href: "/cadastro/crianca",
      color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Cadastro de Responsável",
      description: "Adicionar novo responsável ao sistema",
      icon: UserCheck,
      href: "/cadastro/responsavel",
      color:
        "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    },
    {
      title: "Cadastro de Professor",
      description: "Adicionar novo professor ao sistema",
      icon: School,
      href: "/cadastro/professor",
      color:
        "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Cadastro de Turma",
      description: "Adicionar nova turma ao sistema",
      icon: Users,
      href: "/cadastro/turma",
      color:
        "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    },
     {
      title: "Gerenciar Cadastros",
      description: "Gerenciar cadastros do sistema",
      icon: Settings,
      href: "/gerenciar",
      color:
        "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastro</h1>
          <p className="text-muted-foreground">
            Selecione o tipo de cadastro que deseja realizar
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {cadastroOptions.map((option, index) => (
            <Link key={index} href={option.href}>
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${option.color}`}
                  >
                    <option.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="flex gap-2 items-center text-sm text-muted-foreground">
                    <MousePointerSquareDashed /> Clique para acessar
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
