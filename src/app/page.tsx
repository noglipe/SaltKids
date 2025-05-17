import Link from "next/link";
import {
  UserPlus,
  LogIn,
  LogOut,
  ClapperboardIcon,
  Settings,
  XOctagon

} from "lucide-react";
import {
  Card,
  CardContent,

} from "@/components/ui/card";
import MainLayout from "@/components/main-layout";
import Stats from "@/components/stats";
import AtividadesRecentes from "@/components/atividades-recentes";

export default function Home() {
  // Botões de acesso rápido
  const quickActions = [
    {
      href: "/checkin",
      label: "Check-in",
      icon: LogIn,
      color: "bg-green-100 dark:bg-green-900",
    },
    {
      href: "/checkout",
      label: "Check-out",
      icon: LogOut,
      color: "bg-blue-100 dark:bg-blue-900",
    },
    {
      href: "/cadastro",
      label: "Cadastro",
      icon: UserPlus,
      color: "bg-purple-100 dark:bg-purple-900",
    },
    {
      href: "/turmas",
      label: "Turmas",
      icon: ClapperboardIcon,
      color: "bg-pink-100 dark:bg-pink-900",
    },
     {
      href: "/gerenciar",
      label: "Editar",
      icon: Settings,
      color: "bg-white dark:bg-black",
    },
    {
      href: "/checkout-forcado",
      label: "Checkout Forcado",
      icon: XOctagon,
      color: "bg-white dark:bg-black",
    },

    
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salt kids</h1>
          <p className="text-muted-foreground p-2">
            Bem-vindo ao Sistema de Gestão do Ministério Infantil
          </p>
        </div>

        {/* Estatísticas */}
        <Stats />

        {/* Ações rápidas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className={`rounded-full p-3 mb-3 ${action.color}`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <p className="font-medium">{action.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

       <AtividadesRecentes />
      </div>
    </MainLayout>
  );
}
