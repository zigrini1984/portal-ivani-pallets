"use client";

import React, { useState, useMemo } from "react";
import {
  Truck, Search, AlertCircle, ChevronDown, ChevronUp,
  Plus, X, Loader2, MoreVertical, Wrench, Archive, Send,
  Package, Calendar, Filter, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { criarColeta, enviarColetaParaTriagem, salvarColeta } from "@/app/actions/coletas";

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
    case "enviado_triagem": return { label: "Em Triagem",  dot: "bg-[var(--ivani-blue)]",   text: "text-[var(--ivani-blue)]",   bg: "bg-[var(--ivani-blue)]/8" };
    case "manutencao":      return { label: "Manutenção",  dot: "bg-amber-500",              text: "text-amber-700",             bg: "bg-amber-50" };
    case "estoque":         return { label: "Em Estoque",  dot: "bg-[var(--ivani-teal)]",    text: "text-[var(--ivani-teal)]",   bg: "bg-[var(--ivani-teal)]/8" };
    default:                return { label: "Coletado",    dot: "bg-[var(--ivani-muted)]",   text: "text-[var(--ivani-muted)]",  bg: "bg-[var(--ivani-bg)]" };
  }
}

// Reusable styled input
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ivani-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "px-4 py-3 bg-[var(--ivani-bg)] border border-[var(--ivani-border)] rounded-2xl text-sm font-medium text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-primary)] focus:ring-4 focus:ring-[var(--ivani-primary)]/5 transition-all placeholder:text-[var(--ivani-muted)]/40";

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

  // ─── Handlers (unchanged) ─────────────────────────────────────────────────
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
      const msg = err.message || "Falha na comunicação com o servidor.";
      const code = err.code ? ` (Código: ${err.code})` : "";
      alert(`Erro ao processar status:${code}\n\n${msg}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-[var(--ivani-border)] relative">
        <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-[var(--ivani-primary)]" />
        <div className="relative">
          {/* Subtle Bic Pen Decoration */}
          <svg className="absolute -left-6 -top-6 w-12 h-12 text-[var(--ivani-secondary)] opacity-40 pointer-events-none" viewBox="0 0 100 100">
             <path d="M10,50 Q40,10 90,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
             <path d="M20,60 Q50,20 80,60" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-primary)] mb-2 opacity-80">Gestão de Fluxo PCE</p>
          <h1 className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">Registro de Coletas</h1>
          <p className="text-sm text-[var(--ivani-muted)] mt-2 font-medium max-w-md leading-relaxed">
            Controle de entrada de material bruto e encaminhamento para a triagem operacional.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-[var(--ivani-primary)] text-white rounded-2xl text-sm font-bold overflow-hidden transition-all hover:shadow-[0_8px_25px_-5px_rgba(31,92,63,0.4)] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          Nova Coleta
        </button>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Total Coletas", value: initialColetas.length, icon: <Truck size={20} />, color: "var(--ivani-primary)" },
          { label: "Pallets Brutos", value: totalPallets.toLocaleString("pt-BR"), icon: <Package size={20} />, color: "var(--ivani-teal)" },
          { label: "Em Triagem", value: enviadas, icon: <Send size={20} />, color: "var(--ivani-blue)" },
        ].map((kpi, idx) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="editorial-card p-6 flex flex-col gap-4 group"
          >
            <div className="flex items-center justify-between">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
              >
                {kpi.icon}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-60">Status Real</div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
            </div>
            <div className="pt-3 border-t border-[var(--ivani-border)]/50 flex items-center justify-between">
               <span className="text-[10px] font-bold text-[var(--ivani-muted)]">Atualizado agora</span>
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--ivani-secondary)] animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filter & Search ─────────────────────────────────────────────── */}
      <div className="editorial-card p-4 mb-6 flex flex-col md:flex-row items-center gap-4 border-dashed border-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)]" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por data, motorista ou placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--ivani-bg)]/50 border border-transparent rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-[var(--ivani-primary)] focus:ring-4 focus:ring-[var(--ivani-primary)]/5 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[var(--ivani-border)] rounded-xl text-xs font-bold text-[var(--ivani-muted)] hover:text-[var(--ivani-text)] hover:border-[var(--ivani-primary)]/30 transition-all"
          >
            {sortDir === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            {sortDir === "desc" ? "Mais Recentes" : "Mais Antigas"}
          </button>
          <div className="h-8 w-[1px] bg-[var(--ivani-border)] hidden md:block" />
          <button className="p-3 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-xl hover:text-[var(--ivani-primary)] transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────────── */}
      <div className="editorial-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6 hand-drawn-border border-dashed">
              <Truck size={32} />
            </div>
            <h3 className="text-lg font-black text-[var(--ivani-text)] mb-2">Nenhuma carga encontrada</h3>
            <p className="text-sm text-[var(--ivani-muted)] max-w-sm font-medium">
              Não existem registros que coincidam com sua busca ou ainda não há coletas cadastradas no sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Data e Registro</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Material</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Logística</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Status Operacional</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ivani-border)]">
                <AnimatePresence>
                  {filtered.map((c, i) => {
                    const sc = getStatusConfig(c.status);
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-[var(--ivani-bg)]/30 transition-colors group"
                      >
                        {/* Data / NF */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--ivani-border)] flex items-center justify-center text-[var(--ivani-muted)] shadow-sm">
                              <Calendar size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[var(--ivani-text)]">{formatDate(c.data_coleta)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase">NF:</span>
                                <span className="text-[10px] font-black text-[var(--ivani-primary)]">{c.nf_saida_pce || "S/ REF"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Qtd */}
                        <td className="px-6 py-5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-[var(--ivani-text)]">
                              {c.quantidade_material_bruto.toLocaleString("pt-BR")}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase">unidades</span>
                          </div>
                          <p className="text-[10px] text-[var(--ivani-muted)] font-medium mt-1">Material Bruto</p>
                        </td>

                        {/* Transporte */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ivani-secondary)]" />
                              <p className="text-sm font-bold text-[var(--ivani-text)]">{c.motorista || "Não Informado"}</p>
                            </div>
                            <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-wider mt-1 ml-3.5">
                              {c.caminhao || "PLACA — — —"}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${sc.bg} border border-transparent group-hover:border-current/10 transition-colors`}>
                            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${sc.text}`}>
                              {sc.label}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-3">
                            {c.status !== "enviado_triagem" ? (
                              <button
                                onClick={() => handleUpdateStatus(c.id, "enviado_triagem")}
                                disabled={loadingRowId === c.id}
                                className="group/btn relative h-9 px-4 bg-[var(--ivani-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 overflow-hidden hover:pr-8 transition-all disabled:opacity-50"
                              >
                                {loadingRowId === c.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <>
                                    <span>Triagem</span>
                                    <ArrowRight size={14} className="absolute right-[-20px] group-hover/btn:right-3 transition-all" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="h-9 px-4 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-default">
                                <Send size={12} className="text-[var(--ivani-blue)]" />
                                Processando
                              </div>
                            )}

                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                                className="p-2 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] hover:text-[var(--ivani-text)] rounded-xl transition-all"
                              >
                                <MoreVertical size={18} />
                              </button>
                              {openMenuId === c.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4, x: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                    className="absolute right-0 top-11 w-48 bg-white rounded-2xl shadow-2xl border border-[var(--ivani-border)] p-2 z-20"
                                  >
                                    <p className="px-3 py-2 text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-widest border-b border-[var(--ivani-border)]/50 mb-1">Destino Direto</p>
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "manutencao")}
                                      className="w-full px-3 py-2.5 text-left text-[11px] font-bold text-[var(--ivani-text)] hover:bg-amber-50 hover:text-amber-700 rounded-xl flex items-center gap-3 transition-colors"
                                    >
                                      <Wrench size={14} /> Manutenção
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(c.id, "estoque")}
                                      className="w-full px-3 py-2.5 text-left text-[11px] font-bold text-[var(--ivani-text)] hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-3 transition-colors"
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
        <div className="px-6 py-5 border-t border-[var(--ivani-border)] bg-[var(--ivani-bg)]/20 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[var(--ivani-primary)]" />
             <p className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest">
               Fluxo Operacional Ativo
             </p>
           </div>
           <p className="text-[11px] font-bold text-[var(--ivani-muted)] uppercase">
             Exibindo <span className="text-[var(--ivani-text)] font-black">{filtered.length}</span> de {initialColetas.length} registros
           </p>
        </div>
      </div>

      {/* ── Modal: Nova Coleta ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[var(--ivani-text)]/40 backdrop-blur-md z-[100]"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-[var(--ivani-border)] z-[110] overflow-hidden"
            >
              {/* Modal Banner */}
              <div className="h-2 bg-gradient-to-r from-[var(--ivani-primary)] via-[var(--ivani-secondary)] to-[var(--ivani-teal)]" />
              
              <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-[var(--ivani-primary)]/5 flex items-center justify-center text-[var(--ivani-primary)] hand-drawn-border">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[var(--ivani-text)] tracking-tight">Nova Carga PCE</h2>
                    <p className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase tracking-[0.2em] mt-1">Formulário de Entrada</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-3 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] hover:text-red-500 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateColeta} className="px-8 pb-10 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-5">
                  <FormField label="Data Operacional">
                    <input type="date" required value={formData.data_coleta}
                      onChange={(e) => setFormData({ ...formData, data_coleta: e.target.value })}
                      className={inputCls} />
                  </FormField>
                  <FormField label="Qtd. Pallets">
                    <input type="number" required min="1" placeholder="Ex: 150"
                      value={formData.quantidade_material_bruto}
                      onChange={(e) => setFormData({ ...formData, quantidade_material_bruto: e.target.value })}
                      className={inputCls} />
                  </FormField>
                </div>

                <FormField label="Referência / Nota Fiscal">
                  <input type="text" placeholder="Digite o número da NF-e"
                    value={formData.nf_saida_pce}
                    onChange={(e) => setFormData({ ...formData, nf_saida_pce: e.target.value })}
                    className={inputCls} />
                </FormField>

                <div className="grid grid-cols-2 gap-5">
                  <FormField label="Condutor">
                    <input type="text" placeholder="Nome completo"
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                      className={inputCls} />
                  </FormField>
                  <FormField label="Placa Veículo">
                    <input type="text" placeholder="Ex: ABC-1234"
                      value={formData.caminhao}
                      onChange={(e) => setFormData({ ...formData, caminhao: e.target.value })}
                      className={inputCls} />
                  </FormField>
                </div>

                <FormField label="Notas de Recebimento">
                  <textarea rows={2} placeholder="Descreva qualquer detalhe relevante sobre a carga..."
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    className={`${inputCls} resize-none min-h-[80px] py-4`} />
                </FormField>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                    className="flex-1 py-4 rounded-2xl border border-[var(--ivani-border)] text-xs font-black uppercase tracking-widest text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-[2] py-4 rounded-2xl bg-[var(--ivani-primary)] text-white text-xs font-black uppercase tracking-widest hover:shadow-[0_12px_30px_-5px_rgba(31,92,63,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {isSubmitting ? "Processando..." : "Confirmar Registro"}
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

// Add local component icon for submit button
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
