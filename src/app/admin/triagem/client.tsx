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
import { PageShell, KPIGrid, KPICard, AppCard, StatusBadge, EmptyState, AppButton } from "@/components/ui/tropical";

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
    <PageShell hideHeader={true} 
      title="Painel de Triagem" 
      subtitle="Classifique as cargas recebidas: Reforma · Remanufatura · Compra · Sucateado"
    >
        {/* Error */}
        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700 font-bold">{serverError}</p>
          </div>
        )}

        {/* KPI Cards */}
        <KPIGrid>
          <KPICard title="Pendentes" value={pendentes} colorVariant="orange" />
          <KPICard title="Em Andamento" value={emAndamento} colorVariant="aqua" />
          <KPICard title="Concluídas" value={concluidas} colorVariant="jasmine" />
          <KPICard title="Total Pallets" value={totalPallets.toLocaleString("pt-BR")} colorVariant="default" />
        </KPIGrid>

        {/* Table */}
        <AppCard>
        {triagens.length === 0 ? (
          <EmptyState 
            icon={<ClipboardList size={48} />}
            title="Sem triagens registradas"
            description="Envie coletas para triagem na página de Coletas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-brand-sand/50 border-b border-brand-mirage/5">
                  {["Data Coleta", "Total", "Reforma", "Remanuf.", "Compra", "Sucata", "Status", "Ações"].map(h => (
                    <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-brand-mirage/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-mirage/5">
                <AnimatePresence>
                  {triagens.map((t, i) => (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }} className="hover:bg-brand-sand/30 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-brand-mirage">{fmt(t.data_coleta)}</p>
                        {t.nf_saida_pce && <p className="text-[10px] text-brand-mirage/40 font-bold uppercase tracking-widest mt-0.5">NF: {t.nf_saida_pce}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-brand-mirage">{t.quantidade_total}<span className="text-[10px] text-brand-mirage/40 font-bold uppercase tracking-widest ml-1">un</span></td>
                      <td className="px-5 py-4"><span className="text-xs font-bold text-brand-orange">{t.quantidade_manutencao ?? 0}</span></td>
                      <td className="px-5 py-4"><span className="text-xs font-bold text-brand-mirage/70">{t.quantidade_remanufatura ?? 0}</span></td>
                      <td className="px-5 py-4"><span className="text-xs font-bold text-brand-teal">{t.quantidade_compra_ivani ?? 0}</span></td>
                      <td className="px-5 py-4"><span className="text-xs font-bold text-red-500">{t.quantidade_sucata ?? 0}</span></td>
                      <td className="px-5 py-4">
                        <StatusBadge variant={t.status === 'concluida' ? 'success' : t.status === 'em_andamento' ? 'info' : 'warning'}>{t.status}</StatusBadge>
                      </td>
                      <td className="px-5 py-4">
                        <AppButton onClick={() => openModal(t)} variant={t.status === "concluida" ? "secondary" : "primary"} icon={t.status === "concluida" ? <Eye size={14} /> : <Calculator size={14} />}>
                          {t.status === "concluida" ? "Ver" : "Classificar"}
                        </AppButton>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <div className="px-5 py-4 border-t border-brand-mirage/5 bg-brand-sand/30">
              <p className="text-[10px] font-bold text-brand-mirage/40 uppercase tracking-widest">{triagens.length} registros</p>
            </div>
          </div>
        )}
        </AppCard>

      {/* ─── Modal de Classificação ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && editing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-mirage/30 backdrop-blur-sm" onClick={closeModal} />

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-brand-mirage/10 overflow-hidden max-h-[90vh] flex flex-col">

              {/* Modal Header */}
              <div className="px-7 py-5 border-b border-brand-mirage/5 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal">
                    {isFinalizada ? <Lock size={20} /> : <Calculator size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight text-brand-mirage">
                      {isFinalizada ? "Triagem Concluída" : "Classificação da Carga"}
                    </h3>
                    <p className="text-[10px] font-bold text-brand-mirage/50 uppercase tracking-widest mt-0.5">
                      {fmt(editing.data_coleta)} · {editing.quantidade_total} pallets
                      {editing.nf_saida_pce ? ` · NF ${editing.nf_saida_pce}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="text-brand-mirage/30 hover:text-brand-mirage transition-colors"><X size={20} /></button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Dados da coleta */}
                <div className="px-7 pt-5 pb-4 bg-brand-sand/30 border-b border-brand-mirage/5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <User size={14} />, label: "Motorista", val: editing.motorista || "—" },
                      { icon: <Truck size={14} />, label: "Caminhão", val: editing.caminhao || "—" },
                      { icon: <Package size={14} />, label: "Total Coletado", val: `${editing.quantidade_total} un` },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-2xl p-4 border border-brand-mirage/5">
                        <div className="flex items-center gap-2 text-brand-mirage/40 mb-2">{item.icon}<span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span></div>
                        <p className="text-xs font-black text-brand-mirage">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-7 pt-5 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-brand-teal">{pct.toFixed(0)}% classificado</span>
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${saldo < 0 ? "bg-red-50 text-red-600 border-red-100" : saldo === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-brand-jasmine/20 text-amber-700 border-brand-jasmine/30"}`}>
                      {saldo < 0 ? `Excesso: ${Math.abs(saldo)} un` : saldo === 0 ? "✓ Completo" : `Faltam: ${saldo} un`}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-brand-mirage/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${saldo < 0 ? "bg-red-500" : "bg-brand-teal"} transition-all`} />
                  </div>
                </div>

                <div className="px-7 pb-7 space-y-5">
                  {/* Totais gerais */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-mirage/40 mb-3">Classificação Geral</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Reforma →Manutenção", val: reforma, set: setReforma, color: "orange" },
                        { label: "Remanufatura →Manutenção", val: remanuf, set: setRemanuf, color: "indigo" },
                        { label: "Compra Ivani", val: compra, set: setCompra, color: "aqua" },
                        { label: "Sucateado", val: sucateado, set: setSucateado, color: "red" },
                      ].map(f => (
                        <div key={f.label} className="space-y-1.5">
                          <label className={`text-[9px] font-bold uppercase tracking-tighter ml-1 text-brand-${f.color === "red" ? "indigo" : f.color}`}>{f.label}</label>
                          <input type="number" min="0" disabled={isFinalizada}
                            value={f.val} onChange={e => f.set(parseInt(e.target.value || "0"))}
                            className={`w-full px-4 py-3 bg-white border border-brand-mirage/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 text-brand-mirage`} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-brand-mirage/40 mt-3 ml-1">
                      ℹ️ Apenas <strong>Reforma</strong> e <strong>Remanufatura</strong> seguem para Manutenção.
                    </p>
                  </div>

                  {/* Itens por modelo */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-mirage/40">Por Modelo (Opcional)</p>
                      {!isFinalizada && (
                        <button onClick={addItem}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 px-3 py-1.5 rounded-xl transition-all">
                          <Plus size={12} /> Adicionar Modelo
                        </button>
                      )}
                    </div>

                    {itensForm.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-brand-mirage/10 rounded-3xl">
                        <p className="text-[11px] font-bold text-brand-mirage/30 uppercase tracking-widest">Nenhum modelo adicionado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {itensForm.map((item, idx) => (
                          <div key={idx} className="bg-brand-sand/30 rounded-3xl border border-brand-mirage/5 p-5">
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-brand-mirage/40 mb-1.5 block">Modelo</label>
                                <div className="relative">
                                  <select disabled={isFinalizada} value={item.modelo_pallet_id}
                                    onChange={e => changeItemModel(idx, e.target.value)}
                                    className="w-full appearance-none px-4 py-3 bg-white border border-brand-mirage/10 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 text-brand-mirage">
                                    {initialModelosPallets.map(m => (
                                      <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ""}{m.nome}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-mirage/30 pointer-events-none" size={14} />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3 flex-[1.5]">
                                {[
                                  { label: "Reforma", field: "quantidade_reforma", val: item.quantidade_reforma, cl: "text-brand-orange" },
                                  { label: "Remanuf.", field: "quantidade_remanufatura", val: item.quantidade_remanufatura, cl: "text-brand-mirage/70" },
                                  { label: "Compra", field: "quantidade_compra_ivani", val: item.quantidade_compra_ivani, cl: "text-brand-teal" },
                                ].map(f => (
                                  <div key={f.field}>
                                    <label className={`text-[9px] font-bold uppercase tracking-tighter block mb-1.5 ${f.cl}`}>{f.label}</label>
                                    <input type="number" min="0" disabled={isFinalizada}
                                      value={f.val} onChange={e => updateItem(idx, f.field, parseInt(e.target.value || "0"))}
                                      className="w-full px-3 py-3 bg-white border border-brand-mirage/10 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 text-brand-mirage" />
                                  </div>
                                ))}
                              </div>
                              {!isFinalizada && (
                                <button onClick={() => removeItem(idx)}
                                  className="self-end p-3 text-brand-mirage/30 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all mb-0.5">
                                  <Trash2 size={16} />
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
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-mirage/40 ml-1 mb-2 block">Observações</label>
                    <textarea disabled={isFinalizada} value={obs} onChange={e => setObs(e.target.value)} rows={2}
                      placeholder="Notas sobre a carga..."
                      className="w-full px-4 py-4 bg-brand-sand/30 border border-brand-mirage/10 rounded-2xl text-sm outline-none resize-none focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 text-brand-mirage" />
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3">
                    {isFinalizada ? (
                      <div className="w-full py-4 bg-brand-mirage/5 text-brand-mirage/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                        <Lock size={16} /> Triagem Concluída e Bloqueada
                      </div>
                    ) : (
                      <>
                        <AppButton onClick={() => handleSave(false)} variant="secondary" disabled={isSubmitting || saldo < 0} className="flex-1" icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}>
                          Rascunho
                        </AppButton>
                        <AppButton onClick={() => handleSave(true)} disabled={isSubmitting || saldo !== 0} className="flex-[1.5]" icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}>
                          Concluir Triagem
                        </AppButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
