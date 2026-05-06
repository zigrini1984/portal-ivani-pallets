"use client";

import React, { useState, useMemo } from "react";
import {
  ClipboardList, AlertCircle, CheckCircle2, Loader2, X,
  Save, Calculator, Lock, Eye, Plus, Trash2, ChevronDown,
  Truck, Package, User, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useRouter } from "next/navigation";
import { classificarTriagem } from "@/app/actions/triagens";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModeloPallet { id: string; nome: string; codigo: string; medidas: string; }

interface TriagemItem {
  id?: string; triagem_id: string; modelo_pallet_id: string;
  quantidade_reforma: number; quantidade_remanufatura: number; quantidade_compra_ivani: number;
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

function fmt(v: string) {
  try { return new Intl.DateTimeFormat("pt-BR").format(new Date(v)); } catch { return v; }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente:     { label: "Pendente",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
    em_andamento: { label: "Em Andamento", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    concluida:    { label: "Concluída",    cls: "bg-green-50 text-green-700 border-green-200" },
  };
  const c = map[status] ?? map["pendente"];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // KPI cards
  const pendentes    = useMemo(() => triagens.filter(t => t.status === "pendente").length, [triagens]);
  const emAndamento  = useMemo(() => triagens.filter(t => t.status === "em_andamento").length, [triagens]);
  const concluidas   = useMemo(() => triagens.filter(t => t.status === "concluida").length, [triagens]);
  const totalPallets = useMemo(() => triagens.reduce((a, t) => a + (t.quantidade_total ?? 0), 0), [triagens]);

  const somaForm     = reforma + remanuf + compra + sucateado;
  const saldo        = (editing?.quantidade_total ?? 0) - somaForm;
  const pct          = editing ? Math.min(100, (somaForm / editing.quantidade_total) * 100) : 0;

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
          quantidade_sucateado: 0,
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      <AdminPageHeader title="Triagem de Pallets" subtitle="Ivani Pallets — Admin" icon={<ClipboardList size={18} />} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Painel de Triagem</h1>
          <p className="text-text-dark/50 text-sm mt-1">Classifique as cargas recebidas: Reforma · Remanufatura · Compra · Sucateado</p>
        </div>

        {/* Error */}
        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Pendentes", value: pendentes, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Em Andamento", value: emAndamento, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Concluídas", value: concluidas, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
            { label: "Total Pallets", value: totalPallets.toLocaleString("pt-BR"), color: "text-brand-cyan", bg: "bg-brand-cyan/5", border: "border-brand-cyan/10" },
          ].map(card => (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 mb-1">{card.label}</p>
              <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {triagens.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-3xl border border-brand-pink/20">
            <ClipboardList className="mx-auto text-text-dark/10 mb-4" size={64} />
            <h3 className="text-lg font-bold text-text-dark/40">Sem triagens registradas</h3>
            <p className="text-sm text-text-dark/30 mt-1">Envie coletas para triagem na página de Coletas.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    {["Data Coleta", "Total", "Reforma", "Remanuf.", "Compra", "Sucata", "Status", "Ações"].map(h => (
                      <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pink/5">
                  <AnimatePresence>
                    {triagens.map((t, i) => (
                      <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold">{fmt(t.data_coleta)}</p>
                          {t.nf_saida_pce && <p className="text-[10px] text-text-dark/40 mt-0.5">NF: {t.nf_saida_pce}</p>}
                        </td>
                        <td className="px-5 py-4 text-sm font-black">{t.quantidade_total}<span className="text-[10px] text-text-dark/30 font-normal ml-1">un</span></td>
                        <td className="px-5 py-4"><span className="text-xs font-bold text-amber-600">{t.quantidade_manutencao ?? 0}</span></td>
                        <td className="px-5 py-4"><span className="text-xs font-bold text-purple-600">{t.quantidade_remanufatura ?? 0}</span></td>
                        <td className="px-5 py-4"><span className="text-xs font-bold text-brand-cyan">{t.quantidade_compra_ivani ?? 0}</span></td>
                        <td className="px-5 py-4"><span className="text-xs font-bold text-red-500">{t.quantidade_sucata ?? 0}</span></td>
                        <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                        <td className="px-5 py-4">
                          <button onClick={() => openModal(t)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border
                              ${t.status === "concluida"
                                ? "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                : "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10 hover:bg-brand-cyan/10"}`}>
                            {t.status === "concluida" ? <><Eye size={12} /> Ver</> : <><Calculator size={12} /> Classificar</>}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-brand-pink/10 bg-[#FAFAFA]/50 rounded-b-3xl">
              <p className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest">{triagens.length} registros</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* ─── Modal de Classificação ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && editing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" onClick={closeModal} />

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden max-h-[90vh] flex flex-col">

              {/* Modal Header */}
              <div className="px-7 py-5 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                    {isFinalizada ? <Lock size={20} /> : <Calculator size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">
                      {isFinalizada ? "Triagem Concluída" : "Classificação da Carga"}
                    </h3>
                    <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mt-0.5">
                      {fmt(editing.data_coleta)} · {editing.quantidade_total} pallets
                      {editing.nf_saida_pce ? ` · NF ${editing.nf_saida_pce}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Dados da coleta */}
                <div className="px-7 pt-5 pb-4 bg-[#FAFAFA] border-b border-brand-pink/5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <User size={12} />, label: "Motorista", val: editing.motorista || "—" },
                      { icon: <Truck size={12} />, label: "Caminhão", val: editing.caminhao || "—" },
                      { icon: <Package size={12} />, label: "Total Coletado", val: `${editing.quantidade_total} un` },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-2xl p-3 border border-brand-pink/10">
                        <div className="flex items-center gap-1.5 text-text-dark/40 mb-1">{item.icon}<span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span></div>
                        <p className="text-xs font-bold text-text-dark">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-7 pt-5 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-brand-cyan">{pct.toFixed(0)}% classificado</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${saldo < 0 ? "bg-red-50 text-red-600 border-red-100" : saldo === 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                      {saldo < 0 ? `Excesso: ${Math.abs(saldo)} un` : saldo === 0 ? "✓ Completo" : `Faltam: ${saldo} un`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${saldo < 0 ? "bg-red-500" : "bg-brand-cyan"} transition-all`} />
                  </div>
                </div>

                <div className="px-7 pb-7 space-y-5">
                  {/* Totais gerais */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dark/40 mb-3">Classificação Geral</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Reforma →Manutenção", val: reforma, set: setReforma, color: "amber" },
                        { label: "Remanufatura →Manutenção", val: remanuf, set: setRemanuf, color: "purple" },
                        { label: "Compra Ivani", val: compra, set: setCompra, color: "cyan" },
                        { label: "Sucateado", val: sucateado, set: setSucateado, color: "red" },
                      ].map(f => (
                        <div key={f.label} className="space-y-1.5">
                          <label className={`text-[9px] font-bold uppercase tracking-tighter ml-1 text-${f.color === "cyan" ? "brand-cyan" : f.color + "-600"}`}>{f.label}</label>
                          <input type="number" min="0" disabled={isFinalizada}
                            value={f.val} onChange={e => f.set(parseInt(e.target.value || "0"))}
                            className={`w-full px-3 py-2.5 bg-${f.color === "cyan" ? "brand-cyan/5" : f.color + "-50/40"} border border-${f.color === "cyan" ? "brand-cyan/20" : f.color + "-100"} rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60`} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-dark/40 mt-2 ml-1">
                      ℹ️ Apenas <strong>Reforma</strong> e <strong>Remanufatura</strong> seguem para Manutenção.
                    </p>
                  </div>

                  {/* Itens por modelo */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dark/40">Por Modelo (Opcional)</p>
                      {!isFinalizada && (
                        <button onClick={addItem}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/10 px-3 py-1.5 rounded-lg border border-brand-cyan/10 transition-all">
                          <Plus size={12} /> Adicionar Modelo
                        </button>
                      )}
                    </div>

                    {itensForm.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                        <p className="text-[11px] font-bold text-text-dark/20 uppercase tracking-widest">Nenhum modelo adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {itensForm.map((item, idx) => (
                          <div key={idx} className="bg-[#FAFAFA] rounded-2xl border border-brand-pink/10 p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-text-dark/40 mb-1 block">Modelo</label>
                                <div className="relative">
                                  <select disabled={isFinalizada} value={item.modelo_pallet_id}
                                    onChange={e => changeItemModel(idx, e.target.value)}
                                    className="w-full appearance-none px-3 py-2 bg-white border border-brand-pink/20 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60">
                                    {initialModelosPallets.map(m => (
                                      <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ""}{m.nome}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dark/30 pointer-events-none" size={12} />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 flex-[1.5]">
                                {[
                                  { label: "Reforma", field: "quantidade_reforma", val: item.quantidade_reforma, cl: "text-amber-600" },
                                  { label: "Remanuf.", field: "quantidade_remanufatura", val: item.quantidade_remanufatura, cl: "text-purple-600" },
                                  { label: "Compra", field: "quantidade_compra_ivani", val: item.quantidade_compra_ivani, cl: "text-brand-cyan" },
                                ].map(f => (
                                  <div key={f.field}>
                                    <label className={`text-[9px] font-bold uppercase tracking-tighter block mb-1 ${f.cl}`}>{f.label}</label>
                                    <input type="number" min="0" disabled={isFinalizada}
                                      value={f.val} onChange={e => updateItem(idx, f.field, parseInt(e.target.value || "0"))}
                                      className="w-full px-2 py-2 bg-white border border-brand-pink/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60" />
                                  </div>
                                ))}
                              </div>
                              {!isFinalizada && (
                                <button onClick={() => removeItem(idx)}
                                  className="self-end p-2 text-text-dark/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Observação */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1 mb-1.5 block">Observações</label>
                    <textarea disabled={isFinalizada} value={obs} onChange={e => setObs(e.target.value)} rows={2}
                      placeholder="Notas sobre a carga..."
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-brand-pink/20 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60" />
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3">
                    {isFinalizada ? (
                      <button onClick={closeModal} className="w-full py-3 bg-gray-100 text-text-dark/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Lock size={14} /> Triagem Concluída e Bloqueada
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleSave(false)} disabled={isSubmitting || saldo < 0}
                          className="flex-1 py-3 border border-brand-cyan text-brand-cyan rounded-xl text-xs font-bold hover:bg-brand-cyan/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Rascunho
                        </button>
                        <button onClick={() => handleSave(true)} disabled={isSubmitting || saldo !== 0}
                          className="flex-[1.5] py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg hover:bg-[#1a6e74] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Concluir Triagem
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
