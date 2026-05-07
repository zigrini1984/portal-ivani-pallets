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
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumButton, 
  PremiumModal, 
  PremiumBadge,
  PremiumInput
} from "@/components/ui/editorial";

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
    case "concluida":   return { label: "Concluída",   variant: "teal" as const };
    case "em_andamento":return { label: "Em Processo",  variant: "blue" as const };
    default:            return { label: "Pendente",    variant: "orange" as const };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminTriagemClient({ initialTriagens, initialModelosPallets, serverError }: Props) {
  const router = useRouter();
  const [triagens] = useState<Triagem[]>(initialTriagens);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Triagem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [reforma, setReforma]       = useState(0);
  const [remanuf, setRemanuf]       = useState(0);
  const [compra, setCompra]         = useState(0);
  const [sucateado, setSucateado]   = useState(0);
  const [obs, setObs]               = useState("");
  const [itensForm, setItensForm]   = useState<TriagemItem[]>([]);

  // KPI calculations
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
    setItensForm((t.itens ?? []).map(i => ({
        ...i,
        quantidade_reforma: i.quantidade_reforma ?? 0,
        quantidade_remanufatura: i.quantidade_remanufatura ?? 0,
        quantidade_compra_ivani: i.quantidade_compra_ivani ?? 0,
        quantidade_sucateado: i.quantidade_sucateado ?? 0,
    })));
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

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <BicPenBanner 
        title="Painel de Triagem"
        subtitle="Analise o estado das cargas recebidas e direcione cada unidade para reforma, remanufatura ou estoque."
        image="/branding/banner-operacao.png"
        hueRotate="180deg"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Pendentes", value: pendentes, icon: <ClipboardList size={20} />, color: "#F59E0B" },
          { label: "Em Processo", value: emAndamento, icon: <ArrowRight size={20} />, color: "var(--ivani-blue)" },
          { label: "Concluídas", value: concluidas, icon: <CheckCircle2 size={20} />, color: "var(--ivani-teal)" },
          { label: "Total Pallets", value: totalPallets.toLocaleString("pt-BR"), icon: <Package size={20} />, color: "var(--ivani-primary)" },
        ].map((kpi, idx) => (
          <PremiumCard key={kpi.label} className="p-6 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {(kpi.icon as any) && React.cloneElement(kpi.icon as React.ReactElement<any>, { size: 48, strokeWidth: 1.5 })}
             </div>
            <div className="flex items-center justify-between mb-4">
               <div 
                 className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border border-current/10"
                 style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
               >
                 {kpi.icon}
               </div>
               <div className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-40">Status</div>
            </div>
            <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest mb-1 opacity-60">{kpi.label}</p>
            <p className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
          </PremiumCard>
        ))}
      </div>

      {serverError && (
        <PremiumCard className="mb-10 p-5 bg-red-50/50 border-red-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle size={20} />
          </div>
          <p className="text-sm font-bold text-red-700">{serverError}</p>
        </PremiumCard>
      )}

      <PremiumCard className="overflow-hidden">
        {triagens.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center px-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-8 hand-drawn-border border-dashed opacity-40">
              <ClipboardList size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-[var(--ivani-text)] mb-3">Sem triagens pendentes</h3>
            <p className="text-sm text-[var(--ivani-muted)] max-w-sm font-medium leading-relaxed opacity-60">
              As triagens aparecerão aqui conforme novas coletas forem registradas no sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium min-w-[900px]">
              <thead>
                <tr>
                  <th>Data e Referência</th>
                  <th>Total Carga</th>
                  <th>Classificação Atual</th>
                  <th>Status Operacional</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {triagens.map((t, i) => {
                    const sc = getStatusConfig(t.status);
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.02 }}
                        className={`${i % 2 === 0 ? "" : "zebra-row"} group`}
                      >
                        <td>
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-white border border-[var(--ivani-border)]/60 flex items-center justify-center text-[var(--ivani-muted)] shadow-sm group-hover:rotate-3 transition-transform">
                               <Calendar size={18} strokeWidth={1.5} />
                             </div>
                             <div>
                               <p className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{fmtDate(t.data_coleta)}</p>
                               <p className="text-[10px] font-black text-[var(--ivani-primary)] uppercase tracking-widest mt-1 opacity-60">
                                 {t.nf_saida_pce ? `NF: ${t.nf_saida_pce}` : "S/ REF FISCAL"}
                               </p>
                             </div>
                          </div>
                        </td>
                        <td>
                           <div className="flex items-baseline gap-1.5">
                             <span className="text-lg font-black text-[var(--ivani-text)] tracking-tighter">{t.quantidade_total}</span>
                             <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">UN</span>
                           </div>
                        </td>
                        <td>
                           <div className="flex items-center gap-4">
                              {[
                                { label: "REF", val: t.quantidade_manutencao, cl: "text-orange-600" },
                                { label: "REM", val: t.quantidade_remanufatura, cl: "text-[var(--ivani-blue)]" },
                                { label: "COM", val: t.quantidade_compra_ivani, cl: "text-[var(--ivani-teal)]" },
                                { label: "SUC", val: t.quantidade_sucata, cl: "text-red-500" },
                              ].map(st => (
                                <div key={st.label} className="flex flex-col">
                                   <span className={`text-xs font-black ${st.cl}`}>{st.val || 0}</span>
                                   <span className="text-[8px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">{st.label}</span>
                                </div>
                              ))}
                           </div>
                        </td>
                        <td>
                          <PremiumBadge variant={sc.variant}>
                            {sc.label}
                          </PremiumBadge>
                        </td>
                        <td className="text-right">
                          <PremiumButton
                            variant={t.status === "concluida" ? "secondary" : "primary"}
                            onClick={() => openModal(t)}
                            icon={t.status === "concluida" ? <Eye size={16} /> : <Calculator size={16} />}
                            className="!px-5 !py-2.5 shadow-sm"
                          >
                            {t.status === "concluida" ? "Detalhes" : "Classificar"}
                          </PremiumButton>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        <div className="px-8 py-6 border-t border-[var(--ivani-border)]/50 bg-[var(--ivani-bg)]/30 flex justify-between items-center">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[var(--ivani-blue)] animate-pulse" />
             <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] opacity-60">
               Controle de Qualidade em Tempo Real
             </p>
           </div>
           <p className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-60">
             <span className="text-[var(--ivani-text)]">{triagens.length}</span> cargas para análise
           </p>
        </div>
      </PremiumCard>

      <PremiumModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isFinalizada ? "Relatório Técnico de Triagem" : "Análise e Classificação de Carga"}
      >
        <div className="space-y-10">
          {/* Header Info */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Motorista", val: editing?.motorista || "Não Informado", icon: <User size={14} /> },
              { label: "Placa", val: editing?.caminhao || "— — —", icon: <Truck size={14} /> },
              { label: "Data Carga", val: editing ? fmtDate(editing.data_coleta) : "", icon: <Calendar size={14} /> },
            ].map(i => (
              <div key={i.label} className="p-4 rounded-2xl border border-[var(--ivani-border)] bg-white shadow-sm">
                <div className="flex items-center gap-2 text-[var(--ivani-muted)] mb-2 opacity-50">
                  {i.icon}
                  <span className="text-[9px] font-black uppercase tracking-widest">{i.label}</span>
                </div>
                <p className="text-xs font-black text-[var(--ivani-text)] truncate">{i.val}</p>
              </div>
            ))}
          </div>

          {/* Classification Summary Progress */}
          <div className="p-8 rounded-[2.5rem] border border-[var(--ivani-border)] bg-white shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-end mb-6 relative z-10">
              <div className="space-y-1">
                <p className="text-4xl font-black text-[var(--ivani-primary)] tracking-tight">{pct.toFixed(0)}%</p>
                <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] opacity-60">Progressão da Análise</p>
              </div>
              <div className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                saldo < 0 ? "bg-red-50 text-red-600 border-red-100" : 
                saldo === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {saldo < 0 ? `Excesso: ${Math.abs(saldo)}` : saldo === 0 ? "Carga 100% Classificada" : `Restante: ${saldo} unidades`}
              </div>
            </div>
            <div className="w-full h-3 bg-[var(--ivani-bg)] rounded-full overflow-hidden border border-[var(--ivani-border)]/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className={`h-full rounded-full transition-all ${saldo < 0 ? "bg-red-500" : "bg-[var(--ivani-primary)] shadow-[0_0_12px_var(--ivani-primary)]/30"}`} 
              />
            </div>
          </div>

          {/* Classification Form Grid */}
          <div className="space-y-4">
             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] ml-1 opacity-60">Quantitativo Geral</h4>
             <div className="grid grid-cols-2 gap-6">
                <PremiumInput 
                  label="Reforma (Manutenção)" 
                  type="number" 
                  disabled={isFinalizada}
                  value={reforma} 
                  onChange={e => setReforma(parseInt(e.target.value || "0"))}
                />
                <PremiumInput 
                  label="Remanufatura (Manutenção)" 
                  type="number" 
                  disabled={isFinalizada}
                  value={remanuf} 
                  onChange={e => setRemanuf(parseInt(e.target.value || "0"))}
                />
                <PremiumInput 
                  label="Compra Ivani (Estoque)" 
                  type="number" 
                  disabled={isFinalizada}
                  value={compra} 
                  onChange={e => setCompra(parseInt(e.target.value || "0"))}
                />
                <PremiumInput 
                  label="Sucateado (Descarte)" 
                  type="number" 
                  disabled={isFinalizada}
                  value={sucateado} 
                  onChange={e => setSucateado(parseInt(e.target.value || "0"))}
                />
             </div>
          </div>

          {/* Model Breakdown */}
          <div className="space-y-6">
            <div className="flex justify-between items-center pr-1">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] ml-1 opacity-60">Detalhamento por Modelo</h4>
              {!isFinalizada && (
                <PremiumButton variant="secondary" onClick={addItem} icon={<Plus size={14} />} className="!py-2 !px-4 !text-[9px]">
                  Adicionar Modelo
                </PremiumButton>
              )}
            </div>

            {itensForm.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-[var(--ivani-border)]/50 rounded-[2.5rem] bg-[var(--ivani-bg)]/30 opacity-60">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)]">Nenhum detalhamento por modelo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {itensForm.map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[2rem] border border-[var(--ivani-border)] p-6 shadow-sm relative group/item"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <label className="label-premium">Modelo</label>
                        <select 
                          disabled={isFinalizada} 
                          value={item.modelo_pallet_id}
                          onChange={e => changeItemModel(idx, e.target.value)}
                          className="input-premium py-3 text-xs font-black appearance-none"
                        >
                          {initialModelosPallets.map(m => (
                            <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ""}{m.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-4 gap-3 flex-[2]">
                        {[
                          { label: "REF", field: "quantidade_reforma", val: item.quantidade_reforma },
                          { label: "REM", field: "quantidade_remanufatura", val: item.quantidade_remanufatura },
                          { label: "COM", field: "quantidade_compra_ivani", val: item.quantidade_compra_ivani },
                          { label: "SUC", field: "quantidade_sucateado", val: item.quantidade_sucateado },
                        ].map(f => (
                          <div key={f.field}>
                            <label className="text-[8px] font-black text-[var(--ivani-muted)] uppercase tracking-widest block mb-2 text-center opacity-50">{f.label}</label>
                            <input 
                              type="number" 
                              min="0" 
                              disabled={isFinalizada}
                              value={f.val} 
                              onChange={e => updateItem(idx, f.field, parseInt(e.target.value || "0"))}
                              className="w-full px-2 py-3 bg-[var(--ivani-bg)] border border-[var(--ivani-border)] rounded-xl text-xs font-black text-center outline-none focus:border-[var(--ivani-primary)] transition-all" 
                            />
                          </div>
                        ))}
                      </div>
                      {!isFinalizada && (
                        <button onClick={() => removeItem(idx)} className="self-center lg:self-end p-3 text-[var(--ivani-muted)] hover:text-red-500 transition-all opacity-40 hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Observations */}
          <div className="space-y-4">
            <label className="label-premium">Notas Técnicas do Analista</label>
            <textarea 
              disabled={isFinalizada} 
              value={obs} 
              onChange={e => setObs(e.target.value)} 
              rows={4}
              placeholder="Adicione observações importantes sobre o estado físico ou discrepâncias da carga..."
              className="input-premium min-h-[120px] py-5 resize-none" 
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-10 border-t border-[var(--ivani-border)]/50 flex flex-col sm:flex-row gap-4">
            {isFinalizada ? (
               <div className="w-full p-6 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hand-drawn-border border-dashed">
                 <Lock size={18} /> Histórico Operacional Bloqueado
               </div>
            ) : (
              <>
                <PremiumButton variant="ghost" onClick={() => handleSave(false)} loading={isSubmitting} disabled={saldo < 0} className="flex-1">
                  Rascunho Interno
                </PremiumButton>
                <PremiumButton onClick={() => handleSave(true)} loading={isSubmitting} disabled={saldo !== 0} className="flex-[1.5]">
                  Concluir Triagem
                </PremiumButton>
              </>
            )}
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}
