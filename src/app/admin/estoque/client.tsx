"use client";

import React, { useState, useMemo } from "react";
import {
  Package, History, ArrowUpRight, ArrowDownLeft, Plus,
  Minus, RefreshCcw, Loader2, AlertCircle, X, Save,
  TrendingUp, Truck, Calendar, Info, Search, LayoutGrid, List,
  Activity, ArrowRight, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { reprocessarEstoque, registrarSaidaEstoque } from "@/app/actions/estoque";
import { BicPenBanner } from "@/components/ui/editorial";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EstoqueItem {
  id: string; cliente_id: string; modelo_id: string | null;
  modelo_pallet_id: string | null; modelo_nome_snapshot: string | null;
  quantidade: number | null; quantidade_disponivel: number | null;
  updated_at: string | null;
  modelo_pallet?: { nome?: string; codigo?: string; medidas?: string } | null;
}

interface Movimentacao {
  id: string; tipo: "entrada" | "saida" | "ajuste";
  quantidade: number; origem: string; descricao: string;
  created_at: string;
  modelo_pallet?: { nome?: string } | null;
}

interface PageError { message: string; code?: string; hint?: string; }

interface AdminEstoqueClientProps {
  initialEstoque: EstoqueItem[];
  initialMovimentacoes: Movimentacao[];
  pageError?: PageError | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQty(item: EstoqueItem) {
  return Number(item.quantidade ?? item.quantidade_disponivel ?? 0);
}

function getNome(item: EstoqueItem) {
  return item.modelo_pallet?.nome || item.modelo_nome_snapshot || "Modelo não informado";
}

function fmtDate(v: string) {
  try { return new Date(v).toLocaleString("pt-BR"); } catch { return v; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminEstoqueClient({
  initialEstoque,
  initialMovimentacoes,
  pageError,
}: AdminEstoqueClientProps) {
  const router = useRouter();
  
  const estoque = initialEstoque;
  const movimentacoes = initialMovimentacoes;
  
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"cards" | "historico">("cards");
  const [error, setError] = useState<PageError | null>(pageError ?? null);

  // Saída modal state
  const [isOutflowModalOpen, setIsOutflowModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);
  const [outflowQty, setOutflowQty] = useState(0);
  const [outflowDesc, setOutflowDesc] = useState("");
  const [submittingSaida, setSubmittingSaida] = useState(false);

  // ─── KPIs ───────────────────────────────────────────────────────────────────
  const totalPallets = useMemo(
    () => estoque.reduce((acc, item) => acc + getQty(item), 0),
    [estoque]
  );

  // ─── Handlers (logic preserved) ───────────────────────────────────────────────

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const result = await reprocessarEstoque();
      if (!result.success) {
        setError({ message: "Erro ao reprocessar: " + result.error });
        return;
      }
      router.refresh();
      // Usar feedback visual menos intrusivo no futuro, mas mantendo o alert por agora
      alert(`✅ Estoque reprocessado com sucesso!\nTotal: ${result.quantidadeTotal} pallets`);
    } catch (err: any) {
      setError({ message: "Erro inesperado: " + err.message });
    } finally {
      setSyncing(false);
    }
  };

  const openSaidaModal = (item: EstoqueItem) => {
    setSelectedItem(item);
    setOutflowQty(0);
    setOutflowDesc("");
    setIsOutflowModalOpen(true);
  };

  const closeSaidaModal = () => {
    setIsOutflowModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaida = async () => {
    if (!selectedItem) return;
    if (outflowQty <= 0) return alert("Informe uma quantidade válida.");
    const saldo = getQty(selectedItem);
    if (outflowQty > saldo) return alert(`Saldo insuficiente. Disponível: ${saldo} unidades.`);

    try {
      setSubmittingSaida(true);
      const result = await registrarSaidaEstoque({
        estoqueId: selectedItem.id,
        quantidadeSaida: outflowQty,
        observacao: outflowDesc || undefined,
      });

      if (!result.success) return alert("Erro: " + result.error);

      closeSaidaModal();
      router.refresh();
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setSubmittingSaida(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <BicPenBanner 
        title="Estoque de Pallets" 
        subtitle="Monitoramento em tempo real do saldo de pallets prontos para expedição e registro histórico de movimentações."
        image="/branding/banner-operacao.png"
      />

      <div className="flex justify-end mb-12">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--ivani-primary)] text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest overflow-hidden transition-all hover:shadow-[0_10px_30px_-5px_rgba(31,92,63,0.4)] active:scale-[0.97] disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {syncing ? <Loader2 size={18} className="animate-spin text-[var(--ivani-secondary)]" /> : <RefreshCcw size={18} className="transition-transform group-hover:rotate-180 duration-700 ease-in-out text-[var(--ivani-secondary)]" />}
          <span className="relative z-10">{syncing ? "Sincronizando..." : "Sincronizar Saldo"}</span>
        </button>
      </div>

      {/* ── Dashboard Stats (Sophisticated KPIs) ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         {[
           { 
             label: "Volume em Pátio", 
             val: totalPallets.toLocaleString("pt-BR"), 
             sub: "Unidades disponíveis", 
             icon: <Package size={20} />, 
             color: "var(--ivani-primary)",
             dark: true 
           },
           { 
             label: "Modelos Ativos", 
             val: estoque.length, 
             sub: "Variedades em estoque", 
             icon: <Layers size={20} />, 
             color: "var(--ivani-teal)" 
           },
           { 
             label: "Giro 24h", 
             val: movimentacoes.filter(m => new Date(m.created_at) > new Date(Date.now() - 86400000)).length, 
             sub: "Movimentações recentes", 
             icon: <Activity size={20} />, 
             color: "var(--ivani-blue)" 
           }
         ].map((kpi, i) => (
           <motion.div 
             key={kpi.label} 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }} 
             transition={{ delay: i * 0.1 }}
             className={`editorial-card p-6 relative overflow-hidden group ${kpi.dark ? 'bg-[var(--ivani-primary)] text-white border-none shadow-xl' : 'bg-white'}`}
           >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${kpi.dark ? 'bg-white/15' : 'bg-[var(--ivani-bg)] text-[var(--ivani-primary)]'}`}>
                     {kpi.icon}
                   </div>
                   <ArrowUpRight size={14} className={kpi.dark ? 'text-white/40' : 'text-[var(--ivani-muted)]'} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${kpi.dark ? 'text-white/60' : 'text-[var(--ivani-muted)]'}`}>
                  {kpi.label}
                </p>
                <p className="text-4xl font-black tracking-tighter mb-1">{kpi.val}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${kpi.dark ? 'text-white/40' : 'text-[var(--ivani-muted)]/60'}`}>
                  {kpi.sub}
                </p>
              </div>
              {/* Background Accent */}
              {!kpi.dark && (
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[var(--ivani-bg)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
           </motion.div>
         ))}
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
            <div className="p-5 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-4">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-black text-red-700">{error.message}</p>
                {error.hint && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-widest">{error.hint}</p>}
              </div>
              <button onClick={() => setError(null)} className="p-1.5 hover:bg-red-100 rounded-xl transition-colors text-red-400"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation Tabs (Premium Pill) ────────────────────────────────── */}
      <div className="inline-flex p-1.5 bg-[var(--ivani-bg)]/60 rounded-2xl border border-[var(--ivani-border)] mb-10">
        {[
          { id: "cards", label: "Posição Geral", icon: <LayoutGrid size={16} /> },
          { id: "historico", label: "Timeline de Fluxo", icon: <List size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-[var(--ivani-primary)] shadow-sm border border-[var(--ivani-border)]"
                : "text-[var(--ivani-muted)] hover:text-[var(--ivani-text)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content View ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {estoque.length === 0 ? (
              <div className="col-span-full py-28 editorial-card flex flex-col items-center border-dashed border-2">
                <div className="w-20 h-20 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6 hand-drawn-border">
                  <Package size={32} />
                </div>
                <h3 className="text-xl font-black text-[var(--ivani-text)] mb-2 tracking-tight">Inventário não Processado</h3>
                <p className="text-sm text-[var(--ivani-muted)] max-w-sm text-center font-medium mb-10 leading-relaxed opacity-70">
                  O saldo em pátio ainda não foi calculado para este período ou o pátio está vazio.
                </p>
                <button onClick={handleSync} className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--ivani-primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
                  <RefreshCcw size={16} /> Iniciar Sincronização
                </button>
              </div>
            ) : (
              estoque.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -6 }}
                  className="editorial-card group transition-all flex flex-col hover:border-[var(--ivani-primary)]/20"
                >
                  <div className="p-7 pb-0 flex justify-between items-start mb-6">
                    <div className="w-13 h-13 bg-[var(--ivani-bg)] rounded-2xl flex items-center justify-center text-[var(--ivani-muted)] group-hover:bg-[var(--ivani-primary)]/5 group-hover:text-[var(--ivani-primary)] transition-all">
                      <Package size={26} />
                    </div>
                    <button
                      onClick={() => openSaidaModal(item)}
                      className="px-4 py-2.5 bg-white text-red-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      Registrar Saída
                    </button>
                  </div>

                  <div className="px-7 mb-8 flex-1">
                    <h3 className="text-xl font-black text-[var(--ivani-text)] tracking-tight mb-3 leading-tight group-hover:text-[var(--ivani-primary)] transition-colors">
                      {getNome(item)}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.modelo_pallet?.codigo && (
                        <span className="px-3 py-1.5 bg-[var(--ivani-bg)] text-[var(--ivani-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[var(--ivani-border)]">
                          {item.modelo_pallet.codigo}
                        </span>
                      )}
                      {item.modelo_pallet?.medidas && (
                        <span className="text-[10px] font-black text-[var(--ivani-muted)] opacity-50 uppercase tracking-tighter">
                           {item.modelo_pallet.medidas}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-7 pb-7 mt-auto">
                    <div className="bg-[var(--ivani-bg)]/40 rounded-3xl p-6 border border-[var(--ivani-border)] group-hover:bg-[var(--ivani-primary)] group-hover:border-[var(--ivani-primary)] transition-all duration-300">
                      <p className="text-[9px] font-black text-[var(--ivani-muted)] group-hover:text-white/60 uppercase tracking-[0.2em] mb-3">Estoque Disponível</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-[var(--ivani-text)] group-hover:text-white tracking-tighter">
                          {getQty(item).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-xs font-bold text-[var(--ivani-muted)] group-hover:text-white/60 uppercase tracking-widest">unidades</span>
                      </div>
                    </div>
                    {item.updated_at && (
                      <div className="flex items-center gap-2 mt-5 text-[9px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">
                        <Activity size={12} className="text-[var(--ivani-teal)]" />
                        Refatorado: {fmtDate(item.updated_at)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="historico"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="editorial-card overflow-hidden"
          >
            {movimentacoes.length === 0 ? (
              <div className="py-28 flex flex-col items-center">
                 <div className="w-20 h-20 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6 hand-drawn-border"><History size={32} /></div>
                 <p className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Nenhum registro de movimentação</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                      {["Data & Hora", "Especificação", "Tipo de Fluxo", "Quantidade", "Justificativa"].map((h) => (
                        <th key={h} className="px-7 py-6 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ivani-border)]">
                    {movimentacoes.map((mov) => (
                      <tr key={mov.id} className="hover:bg-[var(--ivani-bg)]/20 transition-colors group">
                        <td className="px-7 py-5">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-[var(--ivani-text)]">{new Date(mov.created_at).toLocaleDateString("pt-BR")}</span>
                              <span className="text-[10px] font-bold text-[var(--ivani-muted)] opacity-60 uppercase">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </td>
                        <td className="px-7 py-5">
                          <span className="text-xs font-black text-[var(--ivani-text)] uppercase tracking-tight group-hover:text-[var(--ivani-primary)] transition-colors">{mov.modelo_pallet?.nome ?? "—"}</span>
                        </td>
                        <td className="px-7 py-5">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                              mov.tipo === "entrada"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}
                          >
                            {mov.tipo === "entrada" ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownLeft size={12} strokeWidth={3} />}
                            {mov.tipo}
                          </div>
                        </td>
                        <td className="px-7 py-5">
                          <span className={`text-sm font-black tracking-tighter ${mov.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                            {mov.tipo === "saida" ? "− " : "+ "}{Number(mov.quantidade).toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="px-7 py-5 max-w-xs">
                          <p className="text-[10px] font-medium text-[var(--ivani-muted)] italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all" title={mov.descricao}>
                            {mov.descricao || "Sem observações registradas."}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-8 py-5 border-t border-[var(--ivani-border)] bg-[var(--ivani-bg)]/10 flex items-center justify-between">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-60">Auditando {movimentacoes.length} registros de fluxo</p>
               <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="w-2 h-2 rounded-full bg-red-400" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Saída (Redesigned High-Precision) ────────────────── */}
      <AnimatePresence>
        {isOutflowModalOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSaidaModal}
              className="fixed inset-0 z-[100] bg-[var(--ivani-text)]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-[var(--ivani-border)] z-[110] overflow-hidden"
            >
              <div className="h-2 bg-red-500" />
              
              <div className="px-8 pt-9 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 flex items-center justify-center text-red-600 hand-drawn-border">
                    <Truck size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--ivani-text)] tracking-tight">Expedição / Saída</h3>
                    <p className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.1em] mt-1 opacity-70">
                      {getNome(selectedItem)}
                    </p>
                  </div>
                </div>
                <button onClick={closeSaidaModal} className="p-3.5 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] hover:text-red-500 rounded-2xl transition-all">
                  <X size={22} />
                </button>
              </div>

              <div className="p-9 pt-2 space-y-9">
                {/* Information Bar */}
                <div className="bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-2xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest">
                      <Package size={14} /> Saldo em Pátio
                   </div>
                   <span className="text-lg font-black text-[var(--ivani-text)]">{getQty(selectedItem)} un</span>
                </div>

                {/* Quantidade Control */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] ml-1 block">Volume de Saída</label>
                  <div className="flex items-center gap-5 p-3 bg-white border-2 border-[var(--ivani-border)] rounded-[2.5rem] focus-within:border-red-500/30 transition-all">
                    <button
                      type="button"
                      onClick={() => setOutflowQty(Math.max(0, outflowQty - 10))}
                      className="w-16 h-16 flex items-center justify-center bg-[var(--ivani-bg)] rounded-[1.8rem] text-[var(--ivani-muted)] hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                    >
                      <Minus size={24} strokeWidth={3} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={outflowQty}
                      onChange={(e) => setOutflowQty(Number(e.target.value))}
                      className="flex-1 bg-transparent border-none text-4xl font-black text-center outline-none text-[var(--ivani-text)]"
                      placeholder="00"
                    />
                    <button
                      type="button"
                      onClick={() => setOutflowQty(outflowQty + 10)}
                      className="w-16 h-16 flex items-center justify-center bg-[var(--ivani-bg)] rounded-[1.8rem] text-[var(--ivani-muted)] hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-90"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Justification Field */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] ml-1 block">Notas de Expedição</label>
                  <textarea
                    value={outflowDesc}
                    onChange={(e) => setOutflowDesc(e.target.value)}
                    className="w-full bg-[var(--ivani-bg)]/30 border border-[var(--ivani-border)] rounded-[2rem] px-6 py-5 text-[15px] font-medium focus:bg-white focus:border-[var(--ivani-primary)] outline-none transition-all min-h-[140px] resize-none text-[var(--ivani-text)]"
                    placeholder="Especifique o destino, cliente ou número da nota fiscal..."
                  />
                </div>

                {/* Confirm Actions */}
                <div className="flex gap-4 pb-4">
                  <button
                    type="button"
                    onClick={closeSaidaModal}
                    disabled={submittingSaida}
                    className="flex-1 py-5 bg-white border border-[var(--ivani-border)] text-[var(--ivani-muted)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--ivani-bg)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaida}
                    disabled={submittingSaida || outflowQty <= 0}
                    className="flex-[2] py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_15px_35px_-8px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submittingSaida ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {submittingSaida ? "Processando..." : "Confirmar Expedição"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
