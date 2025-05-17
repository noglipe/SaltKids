"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import MainLayout from "@/components/main-layout";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { criptografarTexto, descriptografarTexto } from "@/lib/crypto";
import { formatarCPF, gerarCPFHash } from "@/lib/utils";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { use } from "react";

export default function EditarPage({
  params,
}: {
  params: Promise<{ tipo: string; id: string }>;
}) {
  const router = useRouter();

  const { tipo, id } = use(params);

  const [formData, setFormData] = useState<any>({});
  const [turmas, setTurmas] = useState<any[]>([]);
  const [responsaveis, setResponsaveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [relacionamentos, setRelacionamentos] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novoVinculo, setNovoVinculo] = useState({
    responsavelId: "",
    parentesco: "",
  });

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Carregar responsáveis se necessário
        if (tipo === "crianca") {
          const { data: responsaveisData } = await supabase
            .from("responsaveis")
            .select("*")
            .order("nome");
          setResponsaveis(responsaveisData || []);
        }

        // Carregar dados específicos da entidade
        switch (tipo) {
          case "turma":
            await carregarTurma();
            break;
          case "responsavel":
            await carregarResponsavel();
            break;
          case "crianca":
            await carregarCrianca();
            break;
          case "professor":
            await carregarProfessor();
            break;
          default:
            toast("Erro", {
              description: "Tipo de entidade não reconhecido",
            });
            router.push("/");
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast("Erro", {
          description: "Não foi possível carregar os dados. Tente novamente.",
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [tipo, id, supabase, router]);

  // Funções para carregar dados específicos
  const carregarTurma = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    setFormData(data);

    // Carregar professores vinculados à turma
    const { data: professorTurma } = await supabase
      .from("professor_turma")
      .select("*, professores(*)")
      .eq("turma_id", id);

    if (professorTurma) {
      setRelacionamentos(
        professorTurma.map((rel) => ({
          id: rel.id,
          entidadeId: rel.professor_id,
          nome: rel.professores.nome,
          tipo: "professor",
        }))
      );
    }
  };

  const carregarResponsavel = async () => {
    const { data, error } = await supabase
      .from("responsaveis")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const cpfDescriptografado = await descriptografarTexto(data.cpf);

    setFormData({
      ...data,
      cpf: cpfDescriptografado,
    });

    // Carregar crianças vinculadas ao responsável
    const { data: criancaResponsavel } = await supabase
      .from("crianca_responsavel")
      .select("*, criancas(*)")
      .eq("responsavel_id", id);

    if (criancaResponsavel) {
      setRelacionamentos(
        criancaResponsavel.map((rel) => ({
          id: rel.id,
          entidadeId: rel.crianca_id,
          nome: rel.criancas.nome,
          tipo: "crianca",
          parentesco: rel.parentesco,
        }))
      );
    }
  };

  const carregarCrianca = async () => {
    const { data, error } = await supabase
      .from("criancas")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    setFormData(data);

    // Carregar responsáveis vinculados à criança
    const { data: criancaResponsavel } = await supabase
      .from("crianca_responsavel")
      .select("*, responsaveis(*)")
      .eq("crianca_id", id);

    if (criancaResponsavel) {
      setRelacionamentos(
        criancaResponsavel.map((rel) => ({
          id: rel.id,
          entidadeId: rel.responsavel_id,
          nome: rel.responsaveis.nome,
          tipo: "responsavel",
          parentesco: rel.parentesco,
        }))
      );
    }
  };

  const carregarProfessor = async () => {
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    setFormData(data);

    // Carregar turmas vinculadas ao professor
    const { data: professorTurma } = await supabase
      .from("professor_turma")
      .select("*, turmas(*)")
      .eq("professor_id", id);

    if (professorTurma) {
      setRelacionamentos(
        professorTurma.map((rel) => ({
          id: rel.id,
          entidadeId: rel.turma_id,
          nome: rel.turmas.nome,
          tipo: "turma",
        }))
      );
    }
  };

  // Função para atualizar os dados do formulário
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === "cpf") {
      newValue = formatarCPF(value); // Aplica a formatação ao CPF
    }

    setFormData((prev: any) => ({ ...prev, [name]: newValue }));
  };

  // Função para atualizar dados de select
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Função para salvar as alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let result;

      switch (tipo) {
        case "turma":
          result = await atualizarTurma();
          break;
        case "responsavel":
          result = await atualizarResponsavel();
          break;
        case "crianca":
          result = await atualizarCrianca();
          break;
        case "professor":
          result = await atualizarProfessor();
          break;
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Sucesso", {
        description: "Dados atualizados com sucesso!",
      });

      router.push("/gerenciar");
    } catch (error: any) {
      console.error("Erro ao salvar dados:", error);
      toast.error("Erro", {
        description:
          error.message ||
          "Não foi possível salvar as alterações. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Funções para atualizar dados específicos
  const atualizarTurma = async () => {
    const { nome, faixa_etaria, capacidade, sala, descricao } = formData;

    if (!nome || !faixa_etaria || !capacidade || !sala) {
      return { error: "Preencha todos os campos obrigatórios" };
    }

    const { error } = await supabase
      .from("turmas")
      .update({
        nome,
        faixa_etaria,
        capacidade: Number.parseInt(capacidade),
        sala,
        descricao,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  const atualizarResponsavel = async () => {
    let { nome, cpf, telefone } = formData;

    if (!nome || !cpf || !telefone) {
      return { error: "Preencha todos os campos obrigatórios" };
    }

    let cpf_hash = gerarCPFHash(cpf);

    cpf = await criptografarTexto(cpf);

    const { error } = await supabase
      .from("responsaveis")
      .update({
        nome,
        cpf,
        telefone,
        cpf_hash,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  const atualizarCrianca = async () => {
    const { nome, data_nascimento, observacoes } = formData;

    if (!nome || !data_nascimento) {
      return { error: "Preencha todos os campos obrigatórios" };
    }

    const { error } = await supabase
      .from("criancas")
      .update({
        nome,
        data_nascimento,
        observacoes: observacoes || null,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  const atualizarProfessor = async () => {
    const { nome, telefone, data_nascimento } = formData;

    if (!nome || !telefone) {
      return { error: "Preencha todos os campos obrigatórios" };
    }

    const { error } = await supabase
      .from("professores")
      .update({
        nome,
        telefone,
        data_nascimento: data_nascimento || null,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  // Função para excluir a entidade
  const handleDelete = async () => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir este(a) ${getTipoNome()}?`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      let result;

      switch (tipo) {
        case "turma":
          result = await excluirTurma();
          break;
        case "responsavel":
          result = await excluirResponsavel();
          break;
        case "crianca":
          result = await excluirCrianca();
          break;
        case "professor":
          result = await excluirProfessor();
          break;
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Sucesso", {
        description: `${getTipoNome()} excluído(a) com sucesso!`,
      });

      router.push("/gerenciar");
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro", {
        description:
          error.message ||
          `Não foi possível excluir o(a) ${getTipoNome()}. Tente novamente.`,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Funções para excluir entidades específicas
  const excluirTurma = async () => {
    // Verificar se há crianças vinculadas
    const { data: criancas } = await supabase
      .from("criancas")
      .select("id")
      .eq("turma_id", id);

    if (criancas && criancas.length > 0) {
      return {
        error:
          "Não é possível excluir uma turma que possui crianças vinculadas",
      };
    }

    // Remover vínculos com professores
    await supabase.from("professor_turma").delete().eq("turma_id", id);

    // Excluir a turma
    const { error } = await supabase.from("turmas").delete().eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  const excluirResponsavel = async () => {
    // Verificar se há crianças vinculadas
    const { data: vinculos } = await supabase
      .from("crianca_responsavel")
      .select("id")
      .eq("responsavel_id", id);

    if (vinculos && vinculos.length > 0) {
      return {
        error:
          "Não é possível excluir um responsável que possui crianças vinculadas",
      };
    }

    // Verificar se há check-ins ativos
    const { data: checkins } = await supabase
      .from("checkins")
      .select("id")
      .eq("responsavel_id", id)
      .is("checkout_horario", null);

    if (checkins && checkins.length > 0) {
      return {
        error:
          "Não é possível excluir um responsável que possui check-ins ativos",
      };
    }

    // Excluir o responsável
    const { error } = await supabase.from("responsaveis").delete().eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  const excluirCrianca = async () => {
    // Verificar se há check-ins ativos
    const { data: checkins } = await supabase
      .from("checkins")
      .select("id")
      .eq("crianca_id", id)
      .is("checkout_horario", null);

    if (checkins && checkins.length > 0) {
      return {
        error: "Não é possível excluir uma criança que possui check-ins ativos",
      };
    }

    // Remover vínculos com responsáveis
    await supabase.from("crianca_responsavel").delete().eq("crianca_id", id);

    // Excluir a criança
    const { error } = await supabase.from("criancas").delete().eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  const excluirProfessor = async () => {
    // Remover vínculos com turmas
    await supabase.from("professor_turma").delete().eq("professor_id", id);

    // Excluir o professor
    const { error } = await supabase.from("professores").delete().eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  };

  // Função para remover relacionamento
  const removerRelacionamento = async (
    relacionamentoId: string,
    tipoRelacionamento: string
  ) => {
    try {
      let error;

      if (
        tipoRelacionamento === "crianca" ||
        tipoRelacionamento === "responsavel"
      ) {
        // Verificar se é o último responsável da criança
        if (
          tipoRelacionamento === "responsavel" &&
          relacionamentos.length <= 1
        ) {
          toast.error("Erro", {
            description:
              "Não é possível remover o único responsável da criança",
          });
          return;
        }

        const { error: err } = await supabase
          .from("crianca_responsavel")
          .delete()
          .eq("id", relacionamentoId);
        error = err;
      } else if (
        tipoRelacionamento === "professor" ||
        tipoRelacionamento === "turma"
      ) {
        const { error: err } = await supabase
          .from("professor_turma")
          .delete()
          .eq("id", relacionamentoId);
        error = err;
      }

      if (error) throw error;

      // Atualizar a lista de relacionamentos
      setRelacionamentos((prev) =>
        prev.filter((rel) => rel.id !== relacionamentoId)
      );

      toast.success("Sucesso", {
        description: `${
          tipoRelacionamento.charAt(0).toUpperCase() +
          tipoRelacionamento.slice(1)
        } removido(a) com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao remover relacionamento:", error);
      toast("Erro", {
        description:
          "Não foi possível remover o relacionamento. Tente novamente.",
      });
    }
  };

  // Função para obter o nome do tipo
  const getTipoNome = () => {
    switch (tipo) {
      case "turma":
        return "Turma";
      case "responsavel":
        return "Responsável";
      case "crianca":
        return "Criança";
      case "professor":
        return "Professor";
      default:
        return "Item";
    }
  };

  // Renderizar formulário específico
  const renderFormulario = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando...</span>
        </div>
      );
    }

    switch (tipo) {
      case "turma":
        return renderFormularioTurma();
      case "responsavel":
        return renderFormularioResponsavel();
      case "crianca":
        return renderFormularioCrianca();
      case "professor":
        return renderFormularioProfessor();
      default:
        return <p>Tipo de formulário não reconhecido.</p>;
    }
  };

  const renderFormularioTurma = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Turma</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="faixa_etaria">Faixa Etária</Label>
          <Input
            id="faixa_etaria"
            name="faixa_etaria"
            value={formData.faixa_etaria || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacidade">Capacidade</Label>
          <Input
            id="capacidade"
            name="capacidade"
            type="number"
            min="1"
            value={formData.capacidade || ""}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sala">Sala</Label>
        <Input
          id="sala"
          name="sala"
          value={formData.sala || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          value={formData.descricao || ""}
          onChange={handleChange}
          placeholder="Descrição opcional da turma"
        />
      </div>
    </div>
  );

  const renderFormularioResponsavel = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            value={formData.cpf || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={formData.telefone || ""}
            onChange={handleChange}
            required
          />
        </div>
      </div>
    </div>
  );

  const renderFormularioCrianca = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="data_nascimento">Data de Nascimento</Label>
          <Input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            value={formData.data_nascimento || ""}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes || ""}
          onChange={handleChange}
          placeholder="Observações médicas, alergias, etc."
        />
      </div>
    </div>
  );

  const renderFormularioProfessor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={formData.telefone || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_nascimento">Data de Nascimento</Label>
          <Input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            value={formData.data_nascimento || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  // Renderizar relacionamentos
  const renderRelacionamentos = () => {
    if (relacionamentos.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum relacionamento encontrado.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {relacionamentos.map((rel) => (
          <div key={rel.id} className="flex flex-col p-3 bg-muted rounded-md">
            <div>
              <p className="font-medium">{rel.nome}</p>
              {rel.parentesco && (
                <p className="text-xs text-muted-foreground">
                  {rel.parentesco}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                variant="default"
                size="sm"
                type="button"
                onClick={() =>
                  router.push(`/editar/${rel.tipo}/${rel.entidadeId}`)
                }
              >
                Ver
              </Button>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => removerRelacionamento(rel.id, rel.tipo)}
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleNovoVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    const { responsavelId, parentesco } = novoVinculo;
    if (!responsavelId || !parentesco) {
      toast.error("Selecione o responsável e informe o parentesco");
      return;
    }

    const { data: existentes, error: erroBusca } = await supabase
      .from("crianca_responsavel")
      .select("id")
      .eq("crianca_id", id)
      .eq("responsavel_id", responsavelId)
      .limit(1);

    if (erroBusca) {
      toast.error("Erro ao verificar vínculo existente.");
      console.error(erroBusca);
      return;
    }

    if (existentes && existentes.length > 0) {
      toast.warning("Este responsável já está vinculado a essa criança.");
      return;
    }

    const { error, data } = await supabase
      .from("crianca_responsavel")
      .insert({
        crianca_id: id, // id da criança em edição
        responsavel_id: responsavelId,
        parentesco,
      })
      .select() // retorna o registro criado
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao criar vínculo");
      return;
    }

    setMostrarModal(false);

    toast.success("Vínculo criado com sucesso");
    router.push(`/editar/${tipo}/${id}`);
    window.location.reload();
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Editar {getTipoNome()}
            </h1>
            <p className="text-muted-foreground">
              Atualize as informações do cadastro
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent>{renderFormulario()}</CardContent>
                <CardFooter className="flex sm:justify-between flex-col sm:grid sm:grid-cols-3 gap-2">
                  <Button
                    className="w-full"
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                  <div className="flex gap-2 flex-col sm:flex-row w-full">
                    <Button
                      className="w-full"
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting || saving}
                    >
                      {deleting && (
                        <Loader2 className="sm:w-full mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                    <Button
                      className="sm:w-full"
                      type="submit"
                      disabled={saving || deleting}
                    >
                      {saving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tipo === "turma" && "Professores"}
                    {tipo === "responsavel" && "Crianças"}
                    {tipo === "crianca" && "Responsáveis"}
                    {tipo === "professor" && "Turmas"}
                  </CardTitle>
                  {tipo === "crianca" && (
                    <>
                      <Button
                        type="button"
                        onClick={() => setMostrarModal(true)}
                      >
                        + Novo Responsável
                      </Button>

                      {mostrarModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                          <div className="bg-black border-1 border-white p-6 rounded shadow-md w-full max-w-md">
                            <h2 className="text-lg font-semibold mb-4">
                              Vincular Responsável
                            </h2>
                            <div>
                              {/* RESPONSÁVEL COM BUSCA E SCROLL FIXO */}
                              <div className="space-y-2">
                                <Label>Responsável</Label>

                                {/* Exibe selecionado opcionalmente */}
                                {novoVinculo.responsavelId && (
                                  <p className="text-sm text-muted-foreground">
                                    Selecionado:{" "}
                                    <span className="font-extrabold text-cyan-500">
                                      {
                                        responsaveis.find(
                                          (r) =>
                                            r.id === novoVinculo.responsavelId
                                        )?.nome
                                      }
                                    </span>
                                  </p>
                                )}

                                <div className="rounded-md border">
                                  <Command>
                                    <CommandInput placeholder="Buscar responsável..." />
                                    <CommandList className="max-h-48 overflow-y-auto">
                                      {responsaveis.map((r) => (
                                        <CommandItem
                                          key={r.id}
                                          value={r.nome}
                                          onSelect={() =>
                                            setNovoVinculo((prev) => ({
                                              ...prev,
                                              responsavelId: r.id,
                                            }))
                                          }
                                        >
                                          {r.nome}
                                        </CommandItem>
                                      ))}
                                    </CommandList>
                                  </Command>
                                </div>
                              </div>

                              {/* PARENTESCO */}
                              <div className="mt-4 space-y-2">
                                <Label>Parentesco</Label>
                                <Select
                                  onValueChange={(value) =>
                                    setNovoVinculo((prev) => ({
                                      ...prev,
                                      parentesco: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o parentesco" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mãe">Mãe</SelectItem>
                                    <SelectItem value="pai">Pai</SelectItem>
                                    <SelectItem value="Avó/Avó">
                                      Avó/Avó
                                    </SelectItem>
                                    <SelectItem value="Tio/Tia">
                                      Tio/Tia
                                    </SelectItem>
                                    <SelectItem value="Irmão/Irmã">
                                      Irmão/Irmã
                                    </SelectItem>
                                    <SelectItem value="Irmã">Irmã</SelectItem>
                                    <SelectItem value="responsável legal">
                                      Responsável Legal
                                    </SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex justify-end gap-2 mt-6">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => setMostrarModal(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleNovoVinculo}
                                  className="bg-green-700"
                                >
                                  Vincular
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardHeader>
                <CardContent>{renderRelacionamentos()}</CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
