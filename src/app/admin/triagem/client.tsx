"use client";

import React, { useState, useMemo } from "react";
import {
  ClipboardList, AlertCircle, CheckCircle2, Loader2, X,
  Save, Calculator, Lock, Eye, Plus, Trash2, ChevronDown,
  Truck, Package, User, ArrowRight, Calendar, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { classificarTriagem } from "@/app/actions/triagens";
import { BicPenBanner } from "@/components/ui/editorial";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModeloPallet { id: string; nome: string; codigo: string; medidas: string; }

interface TriagemItem {
  id?: string; triagem_id: string; modelo_pallet_id: string;
  quantidade_reforma: number; quantidade_remanufatura: number; quantidade_compra_ivani: number;
  quantidade_sucateado: number;
  modelo_pallet?: ModeloPallet;
}

interface Triagem {
  id: string; cliente_id: string; coleta_id: string;
  nf_saida_pce: string; motorista: string; caminhao: string;
  data_coleta: string; quantidade_total: number;
  quantidade_sucata: number; quantidade_manutencao: number;
  quantidade_remanufatura: number; quantidade_compra_ivani: number;
  status: string; observacao: string; created_at: string;
  itens?: TriagemItem[];
}

interface Props {
  initialTriagens: Triagem[];
  initialModelosPallets: ModeloPallet[];
  serverError?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v: string) {
  try { return new Intl.DateTimeFormat("pt-BR").format(new Date(v)); } catch { return v; }
}

function getStatusConfig(status?: string) {
  switch (status?.toLowerCase()) {
    case "concluida":   return { label: "Concluída",   dot: "bg-[var(--ivani-teal)]",  text: "text-[var(--ivani-teal)]",  bg: "bg-[var(--ivani-teal)]/8" };
    case "em_andamento":return { label: "Em Processo",  dot: "bg-[var(--ivani-blue)]",  text: "text-[var(--ivani-blue)]",  bg: "bg-[var(--ivani-blue)]/8" };
    default:            return { label: "Pendente",    dot: "bg-amber-500",            text: "text-amber-700",            bg: "bg-amber-50" };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminTriagemClient({ initialTriagens, initialModelosPallets, serverError }: Props) {
  const router = useRouter();
  const [triagens] = useState<Triagem[]>(initialTriagens);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Triagem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state — totais gerais
  const [reforma, setReforma]       = useState(0);
  const [remanuf, setRemanuf]       = useState(0);
  const [compra, setCompra]         = useState(0);
  const [sucateado, setSucateado]   = useState(0);
  const [obs, setObs]               = useState("");

  // Itens por modelo
  const [itensForm, setItensForm]   = useState<TriagemItem[]>([]);

  // KPI calculations
  const pendentes    = useMemo(() => triagens.filter(t => t.status === "pendente").length, [triagens]);
  const emAndamento  = useMemo(() => triagens.filter(t => t.status === "em_andamento").length, [triagens]);
  const concluidas   = useMemo(() => triagens.filter(t => t.status === "concluida").length, [triagens]);
  const totalPallets = useMemo(() => triagens.reduce((a, t) => a + (t.quantidade_total ?? 0), 0), [triagens]);

  const somaForm     = reforma + remanuf + compra + sucateado;
  const saldo        = (editing?.quantidade_total ?? 0) - somaForm;
  const pct          = editing ? Math.min(100, (somaForm / editing.quantidade_total) * 100) : 0;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function openModal(t: Triagem) {
    setEditing(t);
    setReforma(t.quantidade_manutencao ?? 0);
    setRemanuf(t.quantidade_remanufatura ?? 0);
    setCompra(t.quantidade_compra_ivani ?? 0);
    setSucateado(t.quantidade_sucata ?? 0);
    setObs(t.observacao ?? "");
    setItensForm(
      (t.itens ?? []).map(i => ({
        ...i,
        quantidade_reforma: i.quantidade_reforma ?? 0,
        quantidade_remanufatura: i.quantidade_remanufatura ?? 0,
        quantidade_compra_ivani: i.quantidade_compra_ivani ?? 0,
        quantidade_sucateado: i.quantidade_sucateado ?? 0,
      }))
    );
    setIsModalOpen(true);
  }

  function closeModal() { setIsModalOpen(false); setEditing(null); }

  function addItem() {
    if (!editing) return;
    const used = new Set(itensForm.map(i => i.modelo_pallet_id));
    const next = initialModelosPallets.find(m => !used.has(m.id));
    if (!next) return alert("Todos os modelos já foram adicionados.");
    setItensForm(prev => [...prev, {
      triagem_id: editing.id, modelo_pallet_id: next.id,
      quantidade_reforma: 0, quantidade_remanufatura: 0, quantidade_compra_ivani: 0,
      quantidade_sucateado: 0,
      modelo_pallet: next,
    }]);
  }

  function removeItem(idx: number) { setItensForm(prev => prev.filter((_, i) => i !== idx)); }

  function updateItem(idx: number, field: string, value: number) {
    setItensForm(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  function changeItemModel(idx: number, id: string) {
    const m = initialModelosPallets.find(x => x.id === id);
    setItensForm(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], modelo_pallet_id: id, modelo_pallet: m };
      return copy;
    });
  }

  async function handleSave(finalizar: boolean) {
    if (!editing) return;
    if (somaForm > editing.quantidade_total) return alert(`Soma (${somaForm}) excede o total (${editing.quantidade_total}).`);
    if (finalizar && somaForm !== editing.quantidade_total)
      return alert(`Para concluir, a soma (${somaForm}) deve ser igual ao total (${editing.quantidade_total}).`);

    setIsSubmitting(true);
    try {
      const result = await classificarTriagem({
        triagemId: editing.id,
        quantidade_reforma: reforma,
        quantidade_remanufatura: remanuf,
        quantidade_compra: compra,
        quantidade_sucateado: sucateado,
        observacao: obs,
        itens: itensForm.map(i => ({
          modelo_pallet_id: i.modelo_pallet_id,
          quantidade_reforma: i.quantidade_reforma,
          quantidade_remanufatura: i.quantidade_remanufatura,
          quantidade_compra_ivani: i.quantidade_compra_ivani,
          quantidade_sucateado: i.quantidade_sucateado,
        })),
        finalizar,
      });
      if (!result.success) throw new Error(result.error);
      closeModal();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar triagem.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFinalizada = editing?.status === "concluida";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto">
      <BicPenBanner 
        title="Painel de Triagem"
        subtitle="Analise o estado das cargas recebidas e direcione cada unidade para reforma, remanufatura ou estoque."
        image="/branding/banner-triagem-v2.png"
      />

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Pendentes", value: pendentes, icon: <ClipboardList size={18} />, color: "#F59E0B" },
          { label: "Em Processo", value: emAndamento, icon: <ArrowRight size={18} />, color: "var(--ivani-blue)" },
          { label: "Concluídas", value: concluidas, icon: <CheckCircle2 size={18} />, color: "var(--ivani-teal)" },
          { label: "Total Pallets", value: totalPallets.toLocaleString("pt-BR"), icon: <Package size={18} />, color: "var(--ivani-primary)" },
        ].map((kpi, idx) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="editorial-card p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-20" style={{ background: kpi.color }} />
            <div className="flex items-center justify-between mb-3">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest">{kpi.label}</p>
               <div 
                 className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
               >
                 {kpi.icon}
               </div>
            </div>
            <p className="text-2xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm font-bold text-red-700">{serverError}</p>
        </div>
      )}

      {/* ── Table Container ─────────────────────────────────────────────── */}
      <div className="editorial-card overflow-hidden">
        {triagens.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6 hand-drawn-border border-dashed">
              <ClipboardList size={32} />
            </div>
            <h3 className="text-lg font-black text-[var(--ivani-text)] mb-2">Sem triagens registradas</h3>
            <p className="text-sm text-[var(--ivani-muted)] max-w-sm font-medium">
              As triagens aparecem aqui conforme novas coletas são registradas no sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Data e Ref.</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Total</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Classificação</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ivani-border)]">
                <AnimatePresence>
                  {triagens.map((t, i) => {
                    const sc = getStatusConfig(t.status);
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-[var(--ivani-bg)]/30 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-9 h-9 rounded-xl bg-white border border-[var(--ivani-border)] flex items-center justify-center text-[var(--ivani-muted)] shadow-sm">
                               <Calendar size={15} />
                             </div>
                             <div>
                               <p className="text-sm font-black text-[var(--ivani-text)]">{fmtDate(t.data_coleta)}</p>
                               <p className="text-[10px] font-black text-[var(--ivani-primary)] uppercase mt-0.5">{t.nf_saida_pce ? `NF: ${t.nf_saida_pce}` : "SEM NF"}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-baseline gap-1">
                             <span className="text-base font-black text-[var(--ivani-text)]">{t.quantidade_total}</span>
                             <span className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase">un</span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <div title="Reforma" className="flex flex-col">
                                 <span className="text-xs font-black text-orange-600">{t.quantidade_manutencao || 0}</span>
                                 <span className="text-[9px] font-bold text-[var(--ivani-muted)] uppercase opacity-60">REF</span>
                              </div>
                              <div title="Remanufatura" className="flex flex-col">
                                 <span className="text-xs font-black text-[var(--ivani-blue)]">{t.quantidade_remanufatura || 0}</span>
                                 <span className="text-[9px] font-bold text-[var(--ivani-muted)] uppercase opacity-60">REM</span>
                              </div>
                              <div title="Compra" className="flex flex-col">
                                 <span className="text-xs font-black text-[var(--ivani-teal)]">{t.quantidade_compra_ivani || 0}</span>
                                 <span className="text-[9px] font-bold text-[var(--ivani-muted)] uppercase opacity-60">COM</span>
                              </div>
                              <div title="Sucata" className="flex flex-col">
                                 <span className="text-xs font-black text-red-500">{t.quantidade_sucata || 0}</span>
                                 <span className="text-[9px] font-bold text-[var(--ivani-muted)] uppercase opacity-60">SUC</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${sc.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${sc.text}`}>
                              {sc.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => openModal(t)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                              t.status === "concluida"
                                ? "bg-[var(--ivani-bg)] text-[var(--ivani-muted)] border border-[var(--ivani-border)] hover:bg-white hover:text-[var(--ivani-text)]"
                                : "bg-[var(--ivani-primary)] text-white hover:shadow-[0_4px_15px_-3px_rgba(31,92,63,0.3)]"
                            }`}
                          >
                            {t.status === "concluida" ? <Eye size={14} /> : <Calculator size={14} />}
                            {t.status === "concluida" ? "Detalhes" : "Classificar"}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-4 border-t border-[var(--ivani-border)] bg-[var(--ivani-bg)]/20">
           <p className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest">
             <span className="text-[var(--ivani-text)] font-black">{triagens.length}</span> registros de carga para análise
           </p>
        </div>
      </div>

      {/* ─── Modal de Classificação ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && editing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[var(--ivani-text)]/40 backdrop-blur-md" 
              onClick={closeModal} 
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-3xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-[var(--ivani-border)] z-[110] flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Banner Accent */}
              <div className="h-2 bg-gradient-to-r from-orange-500 via-[var(--ivani-blue)] to-[var(--ivani-teal)]" />

              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-[var(--ivani-border)] flex justify-between items-center sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[var(--ivani-primary)]/5 rounded-3xl flex items-center justify-center text-[var(--ivani-primary)] hand-drawn-border">
                    {isFinalizada ? <Lock size={24} /> : <ClipboardList size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[var(--ivani-text)] tracking-tight">
                      {isFinalizada ? "Relatório de Triagem" : "Análise de Carga"}
                    </h3>
                    <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest mt-1">
                      {fmtDate(editing.data_coleta)} · {editing.quantidade_total} Pallets Totais
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-3 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] hover:text-red-500 rounded-2xl transition-all">
                   <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 bg-[var(--ivani-bg)]/30">
                {/* Info Cards Row */}
                <div className="px-8 pt-6 pb-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: <User size={14} />, label: "Condutor", val: editing.motorista || "Não Inf." },
                      { icon: <Truck size={14} />, label: "Placa", val: editing.caminhao || "— — —" },
                      { icon: <Info size={14} />, label: "Ref. PCE", val: editing.nf_saida_pce || "Sem NF" },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-2xl p-4 border border-[var(--ivani-border)] shadow-sm">
                        <div className="flex items-center gap-2 text-[var(--ivani-muted)] mb-1.5">
                           {item.icon}
                           <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                        </div>
                        <p className="text-xs font-black text-[var(--ivani-text)] truncate">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classification Progress */}
                <div className="px-8 py-4">
                  <div className="bg-white rounded-3xl p-6 border border-[var(--ivani-border)] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col">
                         <span className="text-lg font-black text-[var(--ivani-primary)]">{pct.toFixed(0)}% Classificado</span>
                         <span className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest">Saldo de carga: {editing.quantidade_total} un</span>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                        saldo < 0 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : saldo === 0 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {saldo < 0 ? `Excesso: ${Math.abs(saldo)}` : saldo === 0 ? "Análise Completa ✓" : `Restante: ${saldo}`}
                      </div>
                    </div>
                    <div className="w-full h-4 bg-[var(--ivani-bg)] rounded-full overflow-hidden border border-[var(--ivani-border)]/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${saldo < 0 ? "bg-red-500" : "bg-[var(--ivani-primary)]"}`} 
                      />
                    </div>
                  </div>
                </div>

                <div className="px-8 pb-10 space-y-8">
                  {/* Totais Gerais Section */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] ml-1">Classificação Direta</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Reforma (Manutenção)", val: reforma, set: setReforma, color: "orange" },
                        { label: "Remanufatura (Manutenção)", val: remanuf, set: setRemanuf, color: "blue" },
                        { label: "Compra Ivani (Estoque)", val: compra, set: setCompra, color: "teal" },
                        { label: "Sucateado (Descarte)", val: sucateado, set: setSucateado, color: "red" },
                      ].map(f => (
                        <div key={f.label} className="group flex flex-col gap-2">
                          <label className={`text-[10px] font-black uppercase tracking-tight ml-1 transition-colors ${
                            f.color === "orange" ? "text-orange-600" : 
                            f.color === "blue" ? "text-[var(--ivani-blue)]" :
                            f.color === "teal" ? "text-[var(--ivani-teal)]" : "text-red-500"
                          }`}>{f.label}</label>
                          <input 
                            type="number" 
                            min="0" 
                            disabled={isFinalizada}
                            value={f.val} 
                            onChange={e => f.set(parseInt(e.target.value || "0"))}
                            className="w-full px-5 py-3.5 bg-white border border-[var(--ivani-border)] rounded-2xl text-base font-black outline-none focus:border-[var(--ivani-primary)] focus:ring-4 focus:ring-[var(--ivani-primary)]/5 transition-all disabled:bg-[var(--ivani-bg)]/50 text-[var(--ivani-text)] shadow-sm" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Itens por Modelo Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pr-1">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] ml-1">Detalhamento por Modelo</h4>
                       {!isFinalizada && (
                         <button 
                           onClick={addItem}
                           className="inline-flex items-center gap-2 text-[10px] font-black text-[var(--ivani-primary)] bg-white border border-[var(--ivani-border)] px-4 py-2 rounded-xl hover:bg-[var(--ivani-bg)] transition-all shadow-sm"
                         >
                           <Plus size={14} /> Adicionar Item
                         </button>
                       )}
                    </div>

                    {itensForm.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-[var(--ivani-border)] rounded-[2.5rem] bg-white/50">
                        <p className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">Nenhum modelo específico detalhado</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {itensForm.map((item, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[2rem] border border-[var(--ivani-border)] p-6 shadow-sm group/item relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-[var(--ivani-primary)]/10" />
                            <div className="flex flex-col lg:flex-row gap-6">
                              <div className="flex-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] mb-2 block">Modelo do Pallet</label>
                                <div className="relative">
                                  <select 
                                    disabled={isFinalizada} 
                                    value={item.modelo_pallet_id}
                                    onChange={e => changeItemModel(idx, e.target.value)}
                                    className="w-full appearance-none px-4 py-3 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-xl text-xs font-black outline-none focus:bg-white focus:border-[var(--ivani-primary)] transition-all text-[var(--ivani-text)]"
                                  >
                                    {initialModelosPallets.map(m => (
                                      <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ""}{m.nome}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] pointer-events-none" size={14} />
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-3 flex-[2]">
                                {[
                                  { label: "REF", field: "quantidade_reforma", val: item.quantidade_reforma, cl: "text-orange-600" },
                                  { label: "REM", field: "quantidade_remanufatura", val: item.quantidade_remanufatura, cl: "text-[var(--ivani-blue)]" },
                                  { label: "COM", field: "quantidade_compra_ivani", val: item.quantidade_compra_ivani, cl: "text-[var(--ivani-teal)]" },
                                  { label: "SUC", field: "quantidade_sucateado", val: item.quantidade_sucateado, cl: "text-red-500" },
                                ].map(f => (
                                  <div key={f.field}>
                                    <label className={`text-[9px] font-black uppercase tracking-widest block mb-2 text-center ${f.cl}`}>{f.label}</label>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      disabled={isFinalizada}
                                      value={f.val} 
                                      onChange={e => updateItem(idx, f.field, parseInt(e.target.value || "0"))}
                                      className="w-full px-2 py-3 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-xl text-xs font-black text-center outline-none focus:bg-white focus:border-[var(--ivani-primary)] transition-all text-[var(--ivani-text)]" 
                                    />
                                  </div>
                                ))}
                              </div>
                              {!isFinalizada && (
                                <button 
                                  onClick={() => removeItem(idx)}
                                  className="self-center lg:self-end p-3 text-[var(--ivani-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Observação Section */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] ml-1 block">Observações Técnicas</label>
                    <textarea 
                      disabled={isFinalizada} 
                      value={obs} 
                      onChange={e => setObs(e.target.value)} 
                      rows={3}
                      placeholder="Adicione notas sobre o estado da carga, avarias específicas ou particularidades do recebimento..."
                      className="w-full px-5 py-5 bg-white border border-[var(--ivani-border)] rounded-[1.5rem] text-sm font-medium outline-none resize-none focus:border-[var(--ivani-primary)] focus:ring-4 focus:ring-[var(--ivani-primary)]/5 transition-all text-[var(--ivani-text)] shadow-sm" 
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[var(--ivani-border)]/50">
                    {isFinalizada ? (
                      <div className="w-full py-5 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-3xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hand-drawn-border border-dashed">
                        <Lock size={18} /> Triagem Bloqueada para Alteração
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleSave(false)} 
                          disabled={isSubmitting || saldo < 0}
                          className="flex-1 py-4 bg-white border border-[var(--ivani-border)] text-[var(--ivani-muted)] hover:text-[var(--ivani-text)] hover:bg-[var(--ivani-bg)] rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Salvar Rascunho
                        </button>
                        <button 
                          onClick={() => handleSave(true)} 
                          disabled={isSubmitting || saldo !== 0}
                          className="flex-[1.5] py-4 bg-[var(--ivani-primary)] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-[0_12px_30px_-5px_rgba(31,92,63,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Concluir e Enviar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
