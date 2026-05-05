"use client";

import React, { useState, useMemo } from "react";
import {
  Truck,
  Search,
  AlertCircle,
  CheckCircle2,
  Package,
  Calendar,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Loader2,
  MoreVertical,
  ArrowRight,
  Wrench,
  Archive,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Coleta {
  id: string;
  cliente_id?: string;
  data_coleta: string;
  quantidade_material_bruto: number;
  motorista?: string;
  caminhao?: string;
  status?: string;
  observacao?: string;
  created_at: string;
  nf_saida_pce?: string;
  enviado_triagem?: boolean;
}

interface AdminColetaClientProps {
  initialColetas: Coleta[];
  error?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
  } catch {
    return value;
  }
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  coletado: {
    label: "Coletado",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <Truck size={11} />,
  },
  enviado_triagem: {
    label: "Triagem",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: <ArrowRight size={11} />,
  },
  manutencao: {
    label: "Manutenção",
    color: "bg-orange-50 text-orange-600 border-orange-200",
    icon: <Wrench size={11} />,
  },
  estoque: {
    label: "Estoque",
    color: "bg-green-50 text-green-600 border-green-200",
    icon: <Archive size={11} />,
  },
};

function StatusBadge({ status }: { status?: string }) {
  const key = status?.toLowerCase() ?? "coletado";
  const cfg = STATUS_MAP[key] ?? STATUS_MAP["coletado"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminColetaClient({
  initialColetas,
  error,
}: AdminColetaClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Per-row loading state
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  
  // Form State - Ajustado para DATE (YYYY-MM-DD)
  const [formData, setFormData] = useState({
    data_coleta: new Date().toISOString().slice(0, 10),
    quantidade_material_bruto: "",
    nf_saida_pce: "",
    motorista: "",
    caminhao: "",
    observacao: ""
  });

  // Action Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...initialColetas]
      .filter(
        (c) =>
          !q ||
          formatDate(c.data_coleta).includes(q) ||
          (c.motorista ?? "").toLowerCase().includes(q) ||
          (c.caminhao ?? "").toLowerCase().includes(q) ||
          (c.status ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const diff =
          new Date(b.data_coleta).getTime() -
          new Date(a.data_coleta).getTime();
        return sortDir === "desc" ? diff : -diff;
      });
  }, [initialColetas, search, sortDir]);

  const totalPallets = initialColetas.reduce(
    (acc, c) => acc + (c.quantidade_material_bruto ?? 0),
    0
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateColeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error: insertError } = await supabase.from("coletas").insert({
        cliente_id: "pce", 
        data_coleta: formData.data_coleta, // Salva apenas a DATA (YYYY-MM-DD)
        quantidade_material_bruto: parseInt(formData.quantidade_material_bruto, 10),
        nf_saida_pce: formData.nf_saida_pce,
        motorista: formData.motorista,
        caminhao: formData.caminhao,
        observacao: formData.observacao,
        status: "coletado"
      });

      if (insertError) throw insertError;

      setIsModalOpen(false);
      setFormData({
        data_coleta: new Date().toISOString().slice(0, 10),
        quantidade_material_bruto: "",
        nf_saida_pce: "",
        motorista: "",
        caminhao: "",
        observacao: ""
      });
      router.refresh();
    } catch (err) {
      console.error("Erro ao criar coleta:", err);
      alert("Erro ao criar coleta. Verifique o console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setOpenMenuId(null);
    setLoadingRowId(id);
    
    try {
      // 1. Localizar os dados da coleta atual na lista
      const coleta = initialColetas.find(c => c.id === id);
      if (!coleta) throw new Error("Coleta não encontrada na lista local.");

      // 2. Se for envio para triagem, realizar verificações e insert extra
      if (newStatus === "enviado_triagem") {
        // Verificar duplicidade na tabela triagens
        // Usamos .limit(1) em vez de .maybeSingle() para evitar o erro
        // "operator does not exist: json ? unknown" em colunas JSON (não JSONB)
        const { data: existingTriagens, error: checkError } = await supabase
          .from("triagens")
          .select("id")
          .eq("coleta_id", id)
          .limit(1);

        if (checkError) throw checkError;

        if (existingTriagens && existingTriagens.length > 0) {
          alert("Atenção: Já existe uma triagem vinculada a esta coleta.");
          setLoadingRowId(null);
          return;
        }

        // A. Atualizar Coleta
        const { error: updateError } = await supabase
          .from("coletas")
          .update({
            status: "enviado_triagem",
            enviado_triagem: true,
            data_envio_triagem: new Date().toISOString()
          })
          .eq("id", id);

        if (updateError) throw updateError;

        // B. Criar Registro na Triagem
        const { error: triagemError } = await supabase
          .from("triagens")
          .insert({
            coleta_id: id,
            cliente_id: coleta.cliente_id || "pce",
            quantidade_total: coleta.quantidade_material_bruto,
            status: "pendente",
            created_at: new Date().toISOString()
          });

        if (triagemError) throw triagemError;
      } else {
        // Atualização simples para outros status (manutenção/estoque)
        const { error: updateError } = await supabase
          .from("coletas")
          .update({ status: newStatus })
          .eq("id", id);

        if (updateError) throw updateError;
      }
      
      router.refresh();
    } catch (err: any) {
      console.error("❌ [handleUpdateStatus] Erro operacional detalhado:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        error: err
      });
      
      const msg = err.message || "Falha na comunicação com o servidor.";
      const details = err.details ? `\n\nDetalhes: ${err.details}` : "";
      const hint = err.hint ? `\n\nDica: ${err.hint}` : "";
      const code = err.code ? ` (Código: ${err.code})` : "";
      
      alert(`Erro ao processar status:${code}\n\n${msg}${details}${hint}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      <AdminPageHeader
        title="Operações de Coleta"
        subtitle="Ivani Pallets — Admin"
        icon={<Truck size={18} />}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Painel de Coletas
            </h1>
            <p className="text-text-dark/50 text-sm mt-1">
              Gerencie e encaminhe coletas recebidas da PCE.
            </p>
          </div>

          <div className="flex gap-4 flex-wrap items-center">
            <div className="bg-white rounded-2xl border border-brand-pink/20 px-5 py-3 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                <Truck size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">
                  Total de Coletas
                </p>
                <p className="text-lg font-black text-text-dark leading-none">
                  {initialColetas.length}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-pink/20 px-5 py-3 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-brown/10 rounded-xl flex items-center justify-center text-brand-brown">
                <Package size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">
                  Total de Pallets
                </p>
                <p className="text-lg font-black text-text-dark leading-none">
                  {totalPallets.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-cyan text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-sm shadow-brand-cyan/20 hover:bg-brand-cyan/90 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Nova Coleta
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/30"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por data, motorista, caminhão…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-pink/20 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-pink/20 rounded-xl text-xs font-bold text-text-dark/50 hover:border-brand-cyan/30 transition-all shadow-sm"
          >
            {sortDir === "desc" ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronUp size={14} />
            )}
            {sortDir === "desc" ? "Mais recentes" : "Mais antigas"}
          </button>
        </div>

        {!error && filtered.length === 0 && (
          <div className="py-32 text-center bg-white rounded-3xl border border-brand-pink/20">
            <Truck className="mx-auto text-text-dark/10 mb-4" size={64} />
            <h3 className="text-lg font-bold text-text-dark/40">
              {search ? "Nenhum resultado encontrado" : "Sem coletas registradas"}
            </h3>
            {search && (
              <p className="text-sm text-text-dark/30 mt-1">
                Tente ajustar o filtro de busca.
              </p>
            )}
          </div>
        )}

        {!error && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-brand-pink/20 overflow-visible shadow-sm"
          >
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-bg-primary">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40 rounded-tl-3xl">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        Data / NF
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      <div className="flex items-center gap-1.5">
                        <Package size={12} />
                        Qtd. Bruta
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      Transporte
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">
                      Observação
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40 rounded-tr-3xl text-right">
                      Operacional
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-pink/5">
                  <AnimatePresence>
                    {filtered.map((c, i) => (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-bg-primary/40 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-dark">
                              {formatDate(c.data_coleta)}
                            </span>
                            {c.nf_saida_pce && (
                              <span className="text-[10px] text-text-dark/50 mt-0.5">
                                NF: {c.nf_saida_pce}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-text-dark">
                            {c.quantidade_material_bruto.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-text-dark/30 font-bold ml-1">
                            un
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-text-dark/70">
                              {c.motorista ?? "—"}
                            </span>
                            <span className="text-[10px] text-text-dark/40 mt-0.5">
                              {c.caminhao ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status ?? "coletado"} />
                        </td>
                        <td className="px-6 py-4 text-xs text-text-dark/40 max-w-[150px] truncate">
                          {c.observacao ?? (
                            <span className="italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botão Principal: Enviar para Triagem */}
                            <button
                              onClick={() => handleUpdateStatus(c.id, "enviado_triagem")}
                              disabled={loadingRowId === c.id || c.status === "enviado_triagem"}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                c.status === "enviado_triagem"
                                  ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                                  : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white"
                              }`}
                            >
                              {loadingRowId === c.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Send size={12} />
                              )}
                              {c.status === "enviado_triagem" ? "Na Triagem" : "Enviar p/ Triagem"}
                            </button>

                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                                className="p-1.5 text-text-dark/30 hover:bg-brand-pink/10 hover:text-text-dark rounded-lg transition-colors"
                              >
                                <MoreVertical size={16} />
                              </button>
                              
                              {openMenuId === c.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-brand-pink/10 py-1.5 z-20 flex flex-col"
                                  >
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "manutencao")}
                                      className="px-4 py-2 text-left text-[11px] font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                    >
                                      <Wrench size={14} /> Manutenção
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "estoque")}
                                      className="px-4 py-2 text-left text-[11px] font-bold text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                      <Archive size={14} /> Estoque
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-brand-pink/10 bg-bg-primary/30 flex items-center justify-between rounded-b-3xl">
              <p className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest">
                {filtered.length} de {initialColetas.length} registros
              </p>
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-text-dark/20 backdrop-blur-sm z-40"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-brand-pink/10 flex justify-between items-center bg-bg-primary/30">
                <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
                  <Plus size={18} className="text-brand-cyan" />
                  Registrar Nova Coleta
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-1.5 text-text-dark/40 hover:bg-white rounded-full transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateColeta} className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/50">
                      Data da Coleta
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.data_coleta}
                      onChange={(e) => setFormData({ ...formData, data_coleta: e.target.value })}
                      className="px-3 py-2 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/50">
                      Qtd. Bruta
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ex: 100"
                      value={formData.quantidade_material_bruto}
                      onChange={(e) => setFormData({ ...formData, quantidade_material_bruto: e.target.value })}
                      className="px-3 py-2 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/50">
                    NF Saída PCE
                  </label>
                  <input
                    type="text"
                    placeholder="Número da Nota Fiscal"
                    value={formData.nf_saida_pce}
                    onChange={(e) => setFormData({ ...formData, nf_saida_pce: e.target.value })}
                    className="px-3 py-2 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/50">
                      Motorista
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do motorista"
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                      className="px-3 py-2 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/50">
                      Placa / Caminhão
                    </label>
                    <input
                      type="text"
                      placeholder="Placa do veículo"
                      value={formData.caminhao}
                      onChange={(e) => setFormData({ ...formData, caminhao: e.target.value })}
                      className="px-3 py-2 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/50">
                    Observação
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes adicionais..."
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    className="px-3 py-2 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 resize-none"
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-text-dark/60 hover:bg-bg-primary transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-brand-cyan text-white shadow-sm shadow-brand-cyan/20 hover:bg-brand-cyan/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Salvando...
                      </>
                    ) : (
                      "Salvar Coleta"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
