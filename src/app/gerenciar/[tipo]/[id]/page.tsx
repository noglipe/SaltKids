"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import MainLayout from "@/components/main-layout"

import type { Turma } from "@/types/database"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function EditarCadastroPage({ params }: { params: { tipo: string; id: string } }) {
  const router = useRouter()
 
  const { tipo, id } = params

  const [formData, setFormData] = useState<any>({})
  const [relacionamentos, setRelacionamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [turmas, setTurmas] = useState<Turma[]>([])

  // Carrega os dados do cadastro
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Carrega as turmas para o select
        if (tipo === "crianca") {
          const { data: turmasData } = await supabase.from("turmas").select("*").order("nome")

          setTurmas(turmasData || [])
        }

        switch (tipo) {
          case "responsavel":
            await fetchResponsavel()
            break
          case "crianca":
            await fetchCrianca()
            break
          case "turma":
            await fetchTurma()
            break
          case "professor":
            await fetchProfessor()
            break
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast("Erro",{
     
          description: "Não foi possível carregar os dados. Tente novamente.",
        
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tipo, id])

  // Funções para buscar dados específicos
  const fetchResponsavel = async () => {
    // Busca o responsável
    const { data: responsavel, error: respError } = await supabase
      .from("responsaveis")
      .select("*")
      .eq("id", id)
      .single()

    if (respError) throw respError
    setFormData(responsavel)

    // Busca as crianças vinculadas
    const { data: relacoes, error: relError } = await supabase
      .from("crianca_responsavel")
      .select("*, criancas(*)")
      .eq("responsavel_id", id)

    if (relError) throw relError

    const criancasVinculadas = relacoes.map((rel) => ({
      id: rel.id,
      criancaId: rel.crianca_id,
      nome: rel.criancas.nome,
      parentesco: rel.parentesco,
      tipo: "crianca",
    }))

    setRelacionamentos(criancasVinculadas)
  }

  const fetchCrianca = async () => {
    // Busca a criança
    const { data: crianca, error: criancaError } = await supabase.from("criancas").select("*").eq("id", id).single()

    if (criancaError) throw criancaError
    setFormData(crianca)

    // Busca os responsáveis vinculados
    const { data: relacoes, error: relError } = await supabase
      .from("crianca_responsavel")
      .select("*, responsaveis(*)")
      .eq("crianca_id", id)

    if (relError) throw relError

    const responsaveisVinculados = relacoes.map((rel) => ({
      id: rel.id,
      responsavelId: rel.responsavel_id,
      nome: rel.responsaveis.nome,
      parentesco: rel.parentesco,
      tipo: "responsavel",
    }))

    setRelacionamentos(responsaveisVinculados)
  }

  const fetchTurma = async () => {
    // Busca a turma
    const { data: turma, error: turmaError } = await supabase.from("turmas").select("*").eq("id", id).single()

    if (turmaError) throw turmaError
    setFormData(turma)

    // Busca os professores vinculados
    const { data: relacoes, error: relError } = await supabase
      .from("professor_turma")
      .select("*, professores(*)")
      .eq("turma_id", id)

    if (relError) throw relError

    const professoresVinculados = relacoes.map((rel) => ({
      id: rel.id,
      professorId: rel.professor_id,
      nome: rel.professores.nome,
      tipo: "professor",
    }))

    setRelacionamentos(professoresVinculados)
  }

  const fetchProfessor = async () => {
    // Busca o professor
    const { data: professor, error: professorError } = await supabase
      .from("professores")
      .select("*")
      .eq("id", id)
      .single()

    if (professorError) throw professorError
    setFormData(professor)

    // Busca as turmas vinculadas
    const { data: relacoes, error: relError } = await supabase
      .from("professor_turma")
      .select("*, turmas(*)")
      .eq("professor_id", id)

    if (relError) throw relError

    const turmasVinculadas = relacoes.map((rel) => ({
      id: rel.id,
      turmaId: rel.turma_id,
      nome: rel.turmas.nome,
      tipo: "turma",
    }))

    setRelacionamentos(turmasVinculadas)
  }

  // Função para atualizar os dados do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Função para atualizar dados de select
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Função para salvar as alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      switch (tipo) {
        case "responsavel":
          await updateResponsavel()
          break
        case "crianca":
          await updateCrianca()
          break
        case "turma":
          await updateTurma()
          break
        case "professor":
          await updateProfessor()
          break
      }
      toast("Sucesso",{
  
        description: "Cadastro atualizado com sucesso!",
      })
      router.push("/gerenciar")
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
     toast("Erro",{
     
        description: "Não foi possível salvar as alterações. Tente novamente.",
      
      })
    } finally {
      setSaving(false)
    }
  }

  // Funções para atualizar dados específicos no Supabase
  const updateResponsavel = async () => {
    const { error } = await supabase.from("responsaveis").update(formData).eq("id", id)

    if (error) throw error
  }

  const updateCrianca = async () => {
    const { error } = await supabase.from("criancas").update(formData).eq("id", id)

    if (error) throw error
  }

  const updateTurma = async () => {
    const { error } = await supabase.from("turmas").update(formData).eq("id", id)

    if (error) throw error
  }

  const updateProfessor = async () => {
    const { error } = await supabase.from("professores").update(formData).eq("id", id)

    if (error) throw error
  }

  // Função para voltar à página anterior
  const handleBack = () => {
    router.back()
  }

  // Função para obter o título da página
  const getPageTitle = () => {
    const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1)
    return `Editar ${tipoFormatado}`
  }

  // Renderiza o formulário de acordo com o tipo
  const renderForm = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <p>Carregando...</p>
        </div>
      )
    }

    switch (tipo) {
      case "responsavel":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" value={formData.nome || ""} onChange={handleChange} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" name="cpf" value={formData.cpf || ""} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input id="telefone" name="telefone" value={formData.telefone || ""} onChange={handleChange} required />
              </div>
            </div>
          </div>
        )

      case "crianca":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" value={formData.nome || ""} onChange={handleChange} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  name="data_nascimento"
                  type="date"
                  value={formData.data_nascimento || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turmaId">Turma</Label>
                <Select
                  value={formData.turma_id || ""}
                  onValueChange={(value) => handleSelectChange("turma_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações Médicas</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes || ""}
                onChange={handleChange}
                placeholder="Alergias, medicações, condições especiais, etc."
                className="min-h-[100px]"
              />
            </div>
          </div>
        )

      case "turma":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Turma</Label>
              <Input id="nome" name="nome" value={formData.nome || ""} onChange={handleChange} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="faixaEtaria">Faixa Etária</Label>
                <Input
                  id="faixaEtaria"
                  name="faixa_etaria"
                  value={formData.faixa_etaria || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade">Capacidade Máxima</Label>
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
              <Label htmlFor="sala">Sala/Localização</Label>
              <Input id="sala" name="sala" value={formData.sala || ""} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Turma</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={formData.descricao || ""}
                onChange={handleChange}
                placeholder="Breve descrição sobre a turma, atividades realizadas, etc."
                className="min-h-[100px]"
              />
            </div>
          </div>
        )

      case "professor":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" value={formData.nome || ""} onChange={handleChange} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input id="telefone" name="telefone" value={formData.telefone || ""} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  name="data_nascimento"
                  type="date"
                  value={formData.data_nascimento || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )

      default:
        return <p>Tipo de cadastro não reconhecido.</p>
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground">Atualize as informações do cadastro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados principais do cadastro</CardDescription>
                </CardHeader>
                <CardContent>{renderForm()}</CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Relacionamentos</CardTitle>
                  <CardDescription>
                    {tipo === "responsavel" && "Crianças vinculadas"}
                    {tipo === "crianca" && "Responsáveis vinculados"}
                    {tipo === "turma" && "Professores vinculados"}
                    {tipo === "professor" && "Turmas vinculadas"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {relacionamentos.length > 0 ? (
                    <div className="space-y-2">
                      {relacionamentos.map((rel, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-md bg-muted">
                          <div>
                            <p className="font-medium">{rel.nome}</p>
                            {rel.parentesco && <p className="text-xs text-muted-foreground">{rel.parentesco}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/gerenciar/${rel.tipo}/${rel.tipo === "crianca" ? rel.criancaId : rel.tipo === "responsavel" ? rel.responsavelId : rel.tipo === "turma" ? rel.turmaId : rel.professorId}`,
                              )
                            }
                          >
                            Ver
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Nenhum relacionamento encontrado.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    + Adicionar{" "}
                    {tipo === "responsavel"
                      ? "Criança"
                      : tipo === "crianca"
                        ? "Responsável"
                        : tipo === "turma"
                          ? "Professor"
                          : "Turma"}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Histórico</CardTitle>
                  <CardDescription>Atividades recentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <p className="font-medium">Última atualização</p>
                      <p className="text-muted-foreground">10/05/2023 às 14:30</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Criado em</p>
                      <p className="text-muted-foreground">01/03/2023 às 09:15</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Último check-in</p>
                      <p className="text-muted-foreground">12/05/2023 às 09:30</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
