"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserPlus,
  LogIn,
  LogOut,
  FileText,
  ClapperboardIcon as ChalkboardTeacher,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const routes = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/cadastro", label: "Cadastro", icon: UserPlus },
    { href: "/checkin", label: "Check-in", icon: LogIn },
    { href: "/checkout", label: "Check-out", icon: LogOut },
    { href: "/turmas", label: "Visualizar Turmas", icon: ChalkboardTeacher },
    { href: "/checkout-forcado", label: "Checkout Forcado", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center-safe w-full dark">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center w-full">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="px-7">
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-bold">Setor Kids</span>
                </Link>
              </div>
              <div className="flex flex-col gap-4 py-4">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-7 py-2 text-sm font-medium ${
                      pathname === route.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <route.icon className="h-5 w-5" />
                    {route.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center-safe">
            <div className="flex gap-6 px-6">
              <Link href="/" className="flex items-center gap-2 font-bold">
                Setor Kids
              </Link>
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`flex items-center gap-2 text-sm font-medium ${
                    pathname === route.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-4 md:py-8">{children}</div>
      </main>
      <footer className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sistema de Gestão do Ministério
            Infantil
          </p>
        </div>
      </footer>
    </div>
  );
}
