import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { descriptografarTexto } from "./crypto";

import CryptoJS from "crypto-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarTelefone(valor: string) {
  return valor
    .replace(/\D/g, "") // Remove tudo que não for número
    .replace(/^(\d{2})(\d)/, "($1) $2") // Coloca parênteses em volta dos dois primeiros dígitos
    .replace(/(\d{5})(\d)/, "$1-$2") // Coloca hífen depois dos 5 dígitos
    .slice(0, 15); // Limita a 15 caracteres
}

export function formatarCPF(valor: string) {
  // Remove tudo que não for número
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  // Aplica a formatação: 000.000.000-00
  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function mascararCPF(cpf: string) {
  if (!cpf) return "";

  cpf = descriptografarTexto(cpf);

  // Garante que só números estão sendo usados
  const numeros = cpf.replace(/\D/g, "").slice(0, 11); // Limita a 11 dígitos

  const primeiros = numeros.slice(0, 3);
  const ultimos = numeros.slice(-2);
  return `${primeiros}.***.***-${ultimos}`;
}

export function gerarCPFHash(cpf: string): string {
  const apenasNumeros = cpf.replace(/\D/g, "");
  return CryptoJS.SHA256(apenasNumeros).toString();
}

export function formatarData(data: string): string {
  try {
    return new Date(data).toLocaleDateString("pt-BR")
  } catch (error) {
    console.log(`Error ${error}`)
    return "Data inválida"
  }
}