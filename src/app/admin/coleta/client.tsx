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
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { criarColeta, enviarColetaParaTriagem, salvarColeta } from "@/app/actions/coletas";
import { EditorialHeader, KpiCard, ActionButton, StatusBadge, EmptyState, FilterBar, DataTable } from "@/components/ui/editorial";

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

function getStatusProps(status?: string): { label: string; type: 'success' | 'warning' | 'error' | 'info' | 'default' } {
  const key = status?.toLowerCase() ?? "coletado";
  switch (key) {
    case 'coletado': return { label: 'Coletado', type: 'default' };
    case 'enviado_triagem': return { label: 'Triagem', type: 'info' };
    case 'manutencao': return { label: 'Manutenção', type: 'warning' };
    case 'estoque': return { label: 'Estoque', type: 'success' };
    default: return { label: 'Coletado', type: 'default' };
  }
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
      const result = await criarColeta({
        data_coleta: formData.data_coleta,
        quantidade_material_bruto: parseInt(formData.quantidade_material_bruto, 10),
        nf_saida_pce: formData.nf_saida_pce,
        motorista: formData.motorista,
        caminhao: formData.caminhao,
        observacao: formData.observacao,
      });

      if (!result.success) throw new Error(result.error);

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
    } catch (err: any) {
      console.error("Erro ao criar coleta:", err);
      alert(err.message || "Erro ao criar coleta. Verifique o console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setOpenMenuId(null);
    setLoadingRowId(id);
    
    try {
      if (newStatus === "enviado_triagem") {
        const result = await enviarColetaParaTriagem(id);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await salvarColeta({ status: newStatus }, id);
        if (result.error) throw new Error(result.error);
      }
      
      router.refresh();
    } catch (err: any) {
      
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
    <>
      <div className="flex justify-between items-start mb-8">
        <EditorialHeader 
          title="Painel de Coletas"
          subtitle="Gerencie e encaminhe coletas recebidas da PCE."
        />
        <ActionButton onClick={() => setIsModalOpen(true)}>
          <div className="flex items-center gap-2">
            <Plus size={16} /> Nova Coleta
          </div>
        </ActionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <KpiCard title="Total de Coletas" value={initialColetas.length} />
        <KpiCard title="Total de Pallets" value={totalPallets.toLocaleString("pt-BR")} />
      </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-3xl p-5 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        <FilterBar>
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)]"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por data, motorista, caminhão…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--ivani-surface)] border border-[var(--ivani-border)] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--ivani-primary)]/30 transition-all"
            />
          </div>
          <ActionButton
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            variant="outline"
          >
            <div className="flex items-center gap-2">
              {sortDir === "desc" ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              {sortDir === "desc" ? "Mais recentes" : "Mais antigas"}
            </div>
          </ActionButton>
        </FilterBar>

        {!error && filtered.length === 0 && (
          <EmptyState 
            message={search ? "Nenhum resultado encontrado. Tente ajustar o filtro." : "Sem coletas registradas."}
          />
        )}

        {!error && filtered.length > 0 && (
          <div className="mb-6">
            <DataTable headers={["Data / NF", "Qtd. Bruta", "Transporte", "Status", "Observação", "Operacional"]}>
                  <AnimatePresence>
                    {filtered.map((c, i) => {
                      const { label, type } = getStatusProps(c.status);
                      return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-[#F8EDD9]/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#133020]">
                              {formatDate(c.data_coleta)}
                            </span>
                            {c.nf_saida_pce && (
                              <span className="text-[10px] text-[#133020]/50 mt-1 font-bold uppercase tracking-widest">
                                NF: {c.nf_saida_pce}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-[#133020]">
                            {c.quantidade_material_bruto.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-[#133020]/40 font-bold ml-1">
                            un
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-[#133020]/80">
                              {c.motorista ?? "—"}
                            </span>
                            <span className="text-[10px] text-[#133020]/50 font-bold uppercase tracking-widest mt-1">
                              {c.caminhao ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={label} variant={type as any} />
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-[#133020]/50 max-w-[150px] truncate">
                          {c.observacao ?? (
                            <span className="italic opacity-50">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* Botão Principal: Enviar para Triagem */}
                            <ActionButton
                              onClick={() => handleUpdateStatus(c.id, "enviado_triagem")}
                              disabled={loadingRowId === c.id || c.status === "enviado_triagem"}
                              variant={c.status === "enviado_triagem" ? "secondary" : "primary"}
                            >
                              <div className="flex items-center gap-2 text-sm">
                                {loadingRowId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                {c.status === "enviado_triagem" ? "Na Triagem" : "Enviar p/ Triagem"}
                              </div>
                            </ActionButton>

                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                                className="p-2 text-[#133020]/30 hover:bg-[#133020]/5 hover:text-[#133020] rounded-xl transition-colors"
                              >
                                <MoreVertical size={16} />
                              </button>
                              
                              {openMenuId === c.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-[#133020]/10 py-2 z-20 flex flex-col"
                                  >
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "manutencao")}
                                      className="px-4 py-2.5 text-left text-xs font-bold text-[#DD5C36] hover:bg-[#DD5C36]/10 flex items-center gap-3 transition-colors"
                                    >
                                      <Wrench size={16} /> Manutenção
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "estoque")}
                                      className="px-4 py-2.5 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                                    >
                                      <Archive size={16} /> Estoque
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )})}
                  </AnimatePresence>
                </DataTable>
            <div className="px-6 py-4 text-xs font-medium text-[var(--ivani-muted)] text-right">
              {filtered.length} de {initialColetas.length} registros
            </div>
          </div>
        )}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#133020]/30 backdrop-blur-sm z-40"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl shadow-2xl border border-[#133020]/10 z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-[#133020]/5 flex justify-between items-center bg-[#F8EDD9]/30">
                <h2 className="text-lg font-bold text-[#133020] flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#327039]/20 text-[#327039] rounded-xl flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  Registrar Nova Coleta
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-[#133020]/30 hover:bg-white hover:text-[#133020] rounded-xl transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateColeta} className="p-6 flex flex-col gap-5 bg-[#FAFAFA]">
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#133020]/50">
                      Data da Coleta
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.data_coleta}
                      onChange={(e) => setFormData({ ...formData, data_coleta: e.target.value })}
                      className="px-4 py-3 bg-white border border-[#133020]/10 rounded-2xl text-sm font-bold text-[#133020] outline-none focus:border-[#327039]/50 focus:ring-2 focus:ring-[#327039]/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#133020]/50">
                      Qtd. Bruta
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ex: 100"
                      value={formData.quantidade_material_bruto}
                      onChange={(e) => setFormData({ ...formData, quantidade_material_bruto: e.target.value })}
                      className="px-4 py-3 bg-white border border-[#133020]/10 rounded-2xl text-sm font-bold text-[#133020] outline-none focus:border-[#327039]/50 focus:ring-2 focus:ring-[#327039]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#133020]/50">
                    NF Saída PCE
                  </label>
                  <input
                    type="text"
                    placeholder="Número da Nota Fiscal"
                    value={formData.nf_saida_pce}
                    onChange={(e) => setFormData({ ...formData, nf_saida_pce: e.target.value })}
                    className="px-4 py-3 bg-white border border-[#133020]/10 rounded-2xl text-sm font-bold text-[#133020] outline-none focus:border-[#327039]/50 focus:ring-2 focus:ring-[#327039]/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#133020]/50">
                      Motorista
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do motorista"
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                      className="px-4 py-3 bg-white border border-[#133020]/10 rounded-2xl text-sm font-bold text-[#133020] outline-none focus:border-[#327039]/50 focus:ring-2 focus:ring-[#327039]/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#133020]/50">
                      Placa / Caminhão
                    </label>
                    <input
                      type="text"
                      placeholder="Placa do veículo"
                      value={formData.caminhao}
                      onChange={(e) => setFormData({ ...formData, caminhao: e.target.value })}
                      className="px-4 py-3 bg-white border border-[#133020]/10 rounded-2xl text-sm font-bold text-[#133020] outline-none focus:border-[#327039]/50 focus:ring-2 focus:ring-[#327039]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#133020]/50">
                    Observação
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes adicionais..."
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    className="px-4 py-4 bg-white border border-[#133020]/10 rounded-2xl text-sm font-bold text-[#133020] outline-none focus:border-[#327039]/50 focus:ring-2 focus:ring-[#327039]/20 resize-none transition-all"
                  />
                </div>

                <div className="mt-6 flex gap-4">
                  <ActionButton
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    variant="outline"
                  >
                    Cancelar
                  </ActionButton>
                  <ActionButton
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center gap-2">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isSubmitting ? "Salvando..." : "Salvar Coleta"}
                    </div>
                  </ActionButton>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


