"use client";

import type React from "react";

import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronsUpDown, Plus, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { mascararCPF } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface Responsavel {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string;
}

interface ResponsavelSelecionado {
  id: string;
  nome: string;
  parentesco: string;
}

export default function CadastroCriancaPage() {
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [responsaveisSelecionados, setResponsaveisSelecionados] = useState<
    ResponsavelSelecionado[]
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResponsavel, setSelectedResponsavel] = useState<string>("");
  const [parentesco, setParentesco] = useState<string>("mãe");
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    observacoes: "",
  });
  const [searchResponsavel, setSearchResponsavel] = useState("");

  const [open, setOpen] = useState(false);

  const selectedObj = responsaveis.find(
    (resp) => resp.id === selectedResponsavel
  );

  // Buscar responsáveis e turmas do banco de dados
  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingData(true);
      try {
        // Buscar responsáveis
        const { data: responsaveisData, error: responsaveisError } =
          await supabase
            .from("responsaveis")
            .select("id, nome, cpf, telefone")
            .order("nome");

        if (responsaveisError) throw responsaveisError;
        setResponsaveis(responsaveisData || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro", {
          description:
            "Não foi possível carregar os dados. Tente novamente mais tarde.",
        });
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, [toast]);

  // Função para lidar com a mudança nos campos do formulário
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Função para adicionar um responsável à lista de selecionados
  const adicionarResponsavel = () => {
    if (!selectedResponsavel) {
      toast.warning("Atenção", {
        description: "Selecione um responsável.",
      });
      return;
    }

    if (!parentesco) {
      toast("Atenção", {
        description: "Selecione o parentesco.",
      });
      return;
    }

    // Verificar se o responsável já foi adicionado
    if (responsaveisSelecionados.some((r) => r.id === selectedResponsavel)) {
      toast("Atenção", {
        description: "Este responsável já foi adicionado.",
      });
      return;
    }

    const responsavel = responsaveis.find((r) => r.id === selectedResponsavel);
    if (responsavel) {
      setResponsaveisSelecionados([
        ...responsaveisSelecionados,
        {
          id: responsavel.id,
          nome: responsavel.nome,
          parentesco: parentesco,
        },
      ]);

      // Limpar seleção
      setSelectedResponsavel("");
      setParentesco("mãe");
      setDialogOpen(false);

      toast.info("Responsável adicionado", {
        description: `${responsavel.nome} foi adicionado como ${parentesco}.`,
      });
    }
  };

  // Função para remover um responsável da lista
  const removerResponsavel = (id: string) => {
    setResponsaveisSelecionados(
      responsaveisSelecionados.filter((r) => r.id !== id)
    );
  };

  // Função para enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se pelo menos um responsável foi adicionado
    if (responsaveisSelecionados.length === 0) {
      toast.warning("Atenção", {
        description: "É necessário adicionar pelo menos um responsável.",
      });
      return;
    }

    // Validar campos obrigatórios
    if (!formData.nome || !formData.dataNascimento) {
      toast("Atenção", {
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Inserir criança
      const { data: crianca, error } = await supabase
        .from("criancas")
        .insert({
          nome: formData.nome,
          data_nascimento: formData.dataNascimento,
          observacoes: formData.observacoes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload da foto se existir
      if (photoFile && crianca) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${crianca.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("fotos-criancas")
          .upload(fileName, photoFile);
      }

      // Criar relações entre criança e responsáveis
      for (const resp of responsaveisSelecionados) {
        const { error: relacaoError } = await supabase
          .from("crianca_responsavel")
          .insert({
            crianca_id: crianca.id,
            responsavel_id: resp.id,
            parentesco: resp.parentesco,
          });

        if (relacaoError) {
          console.error("Erro ao vincular responsável:", relacaoError);
        }
      }

      toast.success("Sucesso", {
        description: "Criança cadastrada com sucesso!",
      });

      router.push("/");
    } catch (error: any) {
      console.error("Erro ao cadastrar criança:", error);
      toast("Erro", {
        description:
          error.message ||
          "Não foi possível cadastrar a criança. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container min-w-4xl mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="mr-2"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Cadastrar Criança</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Criança</CardTitle>
            <CardDescription>
              Preencha os dados para cadastrar uma nova criança no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Nome da criança"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2 ">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleChange}
                    type="date"
                    disabled={isLoading}
                    required
                    className="text-white [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Alergias, medicações, condições especiais, etc."
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label>Responsáveis</Label>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={isLoading || isFetchingData}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Responsável
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Responsável</DialogTitle>
                        <DialogDescription>
                          Selecione um responsável e defina o parentesco.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-2">
                        <Label htmlFor="responsavel">Responsável</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-white"
                              onClick={() => setOpen(!open)} // Garante que o popover abra/feche manualmente
                            >
                              {selectedObj
                                ? selectedObj.nome
                                : "Selecione um responsável"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Buscar responsável..."
                                value={searchResponsavel}
                                onValueChange={setSearchResponsavel}
                              />
                              <CommandEmpty>
                                Nenhum responsável encontrado.
                              </CommandEmpty>
                              <CommandGroup>
                                {responsaveis
                                  .filter((responsavel) =>
                                    responsavel.nome
                                      .toLowerCase()
                                      .includes(searchResponsavel.toLowerCase())
                                  )
                                  .map((resp) => (
                                    <CommandItem
                                      key={resp.id}
                                      onSelect={() => {
                                        setSelectedResponsavel(resp.id);
                                        setSearchResponsavel("");
                                        setOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedResponsavel === resp.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {resp.nome}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parentesco">Parentesco</Label>
                        <Select
                          value={parentesco}
                          onValueChange={setParentesco}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o parentesco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mãe">Mãe</SelectItem>
                            <SelectItem value="pai">Pai</SelectItem>
                            <SelectItem value="Avó/Avó">Avó/Avó</SelectItem>
                            <SelectItem value="Tio/Tia">Tio/Tia</SelectItem>
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

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={adicionarResponsavel}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {responsaveisSelecionados.length === 0 ? (
                  <div className="p-8 text-center border rounded-md bg-gray-50">
                    <p className="text-gray-500">
                      Nenhum responsável adicionado
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Clique em "Adicionar Responsável" para vincular um
                      responsável à criança
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {responsaveisSelecionados.map((resp) => (
                      <div
                        key={resp.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {resp.nome.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{resp.nome}</p>
                            <Badge variant="outline">{resp.parentesco}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerResponsavel(resp.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || responsaveisSelecionados.length === 0}
                >
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
