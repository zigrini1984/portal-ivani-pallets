"use client";

import React, { useState, useMemo } from "react";
import {
  Truck, Search, AlertCircle, ChevronDown, ChevronUp,
  Plus, X, Loader2, MoreVertical, Wrench, Archive, Send,
  Package, Calendar, Filter, ArrowRight, Eye, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { criarColeta, enviarColetaParaTriagem, salvarColeta } from "@/app/actions/coletas";
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumButton, 
  PremiumInput, 
  PremiumModal, 
  PremiumBadge 
} from "@/components/ui/editorial";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  transportadora?: string;
}

interface AdminColetaClientProps {
  initialColetas: Coleta[];
  error?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  try { return new Intl.DateTimeFormat("pt-BR").format(new Date(value)); }
  catch { return value; }
}

function getStatusConfig(status?: string) {
  switch (status?.toLowerCase()) {
    case "enviado_triagem": return { label: "Em Triagem",  variant: "blue" as const };
    case "manutencao":      return { label: "Manutenção",  variant: "orange" as const };
    case "estoque":         return { label: "Em Estoque",  variant: "teal" as const };
    default:                return { label: "Coletado",    variant: "default" as const };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminColetaClient({ initialColetas, error }: AdminColetaClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    data_coleta: new Date().toISOString().slice(0, 10),
    quantidade_material_bruto: "",
    nf_saida_pce: "",
    motorista: "",
    caminhao: "",
    observacao: "",
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...initialColetas]
      .filter((c) =>
        !q ||
        formatDate(c.data_coleta).includes(q) ||
        (c.motorista ?? "").toLowerCase().includes(q) ||
        (c.caminhao ?? "").toLowerCase().includes(q) ||
        (c.status ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const diff = new Date(b.data_coleta).getTime() - new Date(a.data_coleta).getTime();
        return sortDir === "desc" ? diff : -diff;
      });
  }, [initialColetas, search, sortDir]);

  const totalPallets = initialColetas.reduce((acc, c) => acc + (c.quantidade_material_bruto ?? 0), 0);
  const enviadas = initialColetas.filter(c => c.status === "enviado_triagem" || c.enviado_triagem).length;

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
      setFormData({ data_coleta: new Date().toISOString().slice(0, 10), quantidade_material_bruto: "", nf_saida_pce: "", motorista: "", caminhao: "", observacao: "" });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao criar coleta.");
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
      alert(`Erro ao processar status: ${err.message}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <BicPenBanner 
        title="Registro de Coletas"
        subtitle="Controle de entrada de material bruto e encaminhamento para a triagem operacional."
        image="/branding/banner-coleta.png"
      />

      <div className="flex justify-end mb-10">
        <PremiumButton
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={18} />}
        >
          Nova Coleta
        </PremiumButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Total Coletas", value: initialColetas.length, icon: <Truck size={20} />, color: "var(--ivani-primary)" },
          { label: "Pallets Brutos", value: totalPallets.toLocaleString("pt-BR"), icon: <Package size={20} />, color: "var(--ivani-teal)" },
          { label: "Em Triagem", value: enviadas, icon: <Send size={20} />, color: "var(--ivani-blue)" },
        ].map((kpi, idx) => (
          <PremiumCard key={kpi.label} className="p-6 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {(kpi.icon as any) && React.cloneElement(kpi.icon as React.ReactElement<any>, { size: 64, strokeWidth: 1 })}
             </div>
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-current/10"
                style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
              >
                {kpi.icon}
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-40">Insight Operacional</div>
            </div>
            <div>
              <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] mb-1 opacity-60">{kpi.label}</p>
              <p className="text-4xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
            </div>
          </PremiumCard>
        ))}
      </div>

      <PremiumCard className="p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] transition-colors group-focus-within:text-[var(--ivani-primary)]" size={18} />
          <input
            type="text"
            placeholder="Pesquisar registro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-[var(--ivani-bg)]/40 border border-transparent rounded-2xl text-sm font-bold text-[var(--ivani-text)] outline-none focus:bg-white focus:border-[var(--ivani-primary)]/20 focus:ring-8 focus:ring-[var(--ivani-primary)]/5 transition-all placeholder:text-[var(--ivani-muted)]/30"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <PremiumButton
            variant="secondary"
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            icon={sortDir === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            className="flex-1 md:flex-none !py-4"
          >
            {sortDir === "desc" ? "Recentes" : "Antigas"}
          </PremiumButton>
          <div className="h-10 w-[1px] bg-[var(--ivani-border)] hidden md:block" />
          <button className="p-4 bg-[var(--ivani-bg)]/60 text-[var(--ivani-muted)] rounded-2xl hover:text-[var(--ivani-primary)] hover:bg-white border border-transparent hover:border-[var(--ivani-border)] transition-all">
            <Filter size={18} />
          </button>
        </div>
      </PremiumCard>

      <PremiumCard className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center px-6">
            <div className="w-24 h-24 rounded-[2rem] bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-8 hand-drawn-border border-dashed opacity-40">
              <Truck size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-[var(--ivani-text)] mb-3">Vazio como caderno novo</h3>
            <p className="text-sm text-[var(--ivani-muted)] max-w-sm font-medium leading-relaxed opacity-60">
              Não encontramos nenhum registro de coleta com esses termos. Tente uma nova busca ou cadastre uma carga.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium min-w-[900px]">
              <thead>
                <tr>
                  <th>Data e Registro</th>
                  <th>Material Bruto</th>
                  <th>Logística e Veículo</th>
                  <th>Status Operacional</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((c, i) => {
                    const sc = getStatusConfig(c.status);
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                        className={`${i % 2 === 0 ? "" : "zebra-row"} group`}
                      >
                        <td>
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-white border border-[var(--ivani-border)]/60 flex items-center justify-center text-[var(--ivani-muted)] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                              <Calendar size={18} strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{formatDate(c.data_coleta)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase opacity-30 tracking-widest">REG</span>
                                <span className="text-[10px] font-black text-[var(--ivani-primary)]">{c.nf_saida_pce || "S/ REF"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-[var(--ivani-text)] tracking-tighter">
                              {c.quantidade_material_bruto.toLocaleString("pt-BR")}
                            </span>
                            <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">UN</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                             <Package size={10} className="text-[var(--ivani-primary)] opacity-40" />
                             <p className="text-[9px] text-[var(--ivani-muted)] font-black uppercase tracking-[0.1em] opacity-40">Carga Industrial</p>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ivani-primary)] group-hover:scale-150 transition-transform" />
                              <p className="text-xs font-black text-[var(--ivani-text)] tracking-tight">{c.motorista || "Condutor Indefinido"}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 ml-3.5">
                              <span className="text-[10px] font-black text-[var(--ivani-muted)] opacity-30 uppercase tracking-[0.2em]">{c.caminhao || "PLACA — — —"}</span>
                              <div className="w-1 h-1 rounded-full bg-[var(--ivani-border)]" />
                              <span className="text-[10px] font-black text-[var(--ivani-muted)] opacity-30 uppercase tracking-[0.2em]">{c.transportadora || "PRÓPRIA"}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <PremiumBadge variant={sc.variant}>
                            {sc.label}
                          </PremiumBadge>
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.status !== "enviado_triagem" ? (
                              <button
                                onClick={() => handleUpdateStatus(c.id, "enviado_triagem")}
                                disabled={loadingRowId === c.id}
                                className="h-9 px-4 bg-[var(--ivani-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--ivani-text)] transition-all active:scale-95 disabled:opacity-50 group/btn shadow-sm"
                              >
                                {loadingRowId === c.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <>
                                    <span>Triar</span>
                                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="h-9 px-4 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-default border border-[var(--ivani-border)]/50">
                                <Send size={12} className="text-[var(--ivani-blue)]" />
                                Triagem
                              </div>
                            )}

                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                                className="p-2.5 bg-white border border-[var(--ivani-border)] text-[var(--ivani-muted)] rounded-xl hover:text-[var(--ivani-text)] hover:border-[var(--ivani-text)]/20 transition-all shadow-sm"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openMenuId === c.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-[var(--ivani-border)] p-2 z-20 paper-card"
                                  >
                                    <p className="px-3 py-2 text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-widest border-b border-[var(--ivani-border)]/50 mb-1 opacity-50">Desvio Rápido</p>
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "manutencao")}
                                      className="w-full px-3 py-2.5 text-left text-[11px] font-black text-[var(--ivani-muted)] hover:bg-amber-50 hover:text-amber-700 rounded-xl flex items-center gap-3 transition-all"
                                    >
                                      <Wrench size={14} /> Manutenção
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "estoque")}
                                      className="w-full px-3 py-2.5 text-left text-[11px] font-black text-[var(--ivani-muted)] hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-3 transition-all"
                                    >
                                      <Archive size={14} /> Estoque Direto
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        <div className="px-8 py-6 border-t border-[var(--ivani-border)]/50 bg-[var(--ivani-bg)]/30 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[var(--ivani-primary)] animate-pulse shadow-[0_0_8px_var(--ivani-primary)]" />
             <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] opacity-60">
               Audit Intelligence Ativo
             </p>
           </div>
           <p className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-60">
             Mostrando <span className="text-[var(--ivani-text)]">{filtered.length}</span> registros
           </p>
        </div>
      </PremiumCard>

      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Registro de Carga"
      >
        <form onSubmit={handleCreateColeta} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <PremiumInput 
                label="Data do Recebimento" 
                type="date" 
                required 
                value={formData.data_coleta}
                onChange={(e) => setFormData({ ...formData, data_coleta: e.target.value })}
             />
             <PremiumInput 
                label="Referência Fiscal (NF)" 
                placeholder="Ex: 001.234"
                value={formData.nf_saida_pce}
                onChange={(e) => setFormData({ ...formData, nf_saida_pce: e.target.value })}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <PremiumInput 
                label="Motorista Responsável" 
                placeholder="Nome do condutor"
                required
                value={formData.motorista}
                onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
             />
             <PremiumInput 
                label="Placa do Veículo" 
                placeholder="ABC-1234"
                required
                value={formData.caminhao}
                onChange={(e) => setFormData({ ...formData, caminhao: e.target.value })}
             />
          </div>

          <PremiumInput 
            label="Quantidade de Material Bruto (UN)" 
            type="number"
            placeholder="0"
            required
            value={formData.quantidade_material_bruto}
            onChange={(e) => setFormData({ ...formData, quantidade_material_bruto: e.target.value })}
          />

          <div className="flex flex-col gap-2">
            <label className="label-premium">Observações Operacionais</label>
            <textarea 
              className="input-premium min-h-[100px] resize-none py-4"
              placeholder="Descreva detalhes da carga ou divergências..."
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            />
          </div>

          <div className="pt-8 border-t border-[var(--ivani-border)]/50 flex justify-end gap-4">
             <PremiumButton
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
             >
                Descartar
             </PremiumButton>
             <PremiumButton
                type="submit"
                loading={isSubmitting}
             >
                Confirmar Registro
             </PremiumButton>
          </div>
        </form>
      </PremiumModal>
    </div>
  );
}
