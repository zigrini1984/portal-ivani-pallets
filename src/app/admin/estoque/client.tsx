"use client";

import React, { useState, useMemo } from "react";
import {
  Package, History, ArrowUpRight, ArrowDownLeft, Plus,
  Minus, RefreshCcw, Loader2, AlertCircle, X, Save,
  TrendingUp, Truck, Calendar, Info, Search, LayoutGrid, List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { reprocessarEstoque, registrarSaidaEstoque } from "@/app/actions/estoque";

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
      alert(`✅ Estoque reprocessado com sucesso!\nModelos: ${result.modelosAtualizados}\nTotal: ${result.quantidadeTotal} pallets`);
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
    setOutflowQty(0);
    setOutflowDesc("");
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-[var(--ivani-border)] relative">
        <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-[var(--ivani-teal)]" />
        <div className="relative">
          {/* Subtle Bic Pen Decoration */}
          <svg className="absolute -left-6 -top-6 w-12 h-12 text-[var(--ivani-teal)] opacity-40 pointer-events-none" viewBox="0 0 100 100">
             <path d="M5,50 Q45,5 95,50 T185,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
             <path d="M10,65 Q50,20 90,65 T170,65" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-primary)] mb-2 opacity-80">Inventário Ativo</p>
          <h1 className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">Estoque de Pallets</h1>
          <p className="text-sm text-[var(--ivani-muted)] mt-2 font-medium max-w-lg leading-relaxed">
            Controle de saldo disponível por modelo e histórico detalhado de todas as movimentações do pátio.
          </p>
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing}
          className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-[var(--ivani-primary)] text-white rounded-2xl text-sm font-bold overflow-hidden transition-all hover:shadow-[0_8px_25px_-5px_rgba(31,92,63,0.4)] active:scale-[0.98] disabled:opacity-60"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} className="transition-transform group-hover:rotate-180 duration-500" />}
          Reprocessar Saldo
        </button>
      </div>

      {/* ── Dashboard Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="editorial-card p-6 bg-[var(--ivani-primary)] text-white border-none shadow-[0_20px_40px_-15px_rgba(31,92,63,0.3)]">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Package size={20} /></div>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Volume Total</span>
            </div>
            <p className="text-4xl font-black tracking-tight">{totalPallets.toLocaleString("pt-BR")}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mt-2">Pallets em pátio</p>
         </motion.div>
         
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="editorial-card p-6">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 rounded-xl bg-[var(--ivani-teal)]/10 text-[var(--ivani-teal)] flex items-center justify-center"><TrendingUp size={20} /></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-60">Modelos</span>
            </div>
            <p className="text-4xl font-black text-[var(--ivani-text)] tracking-tight">{estoque.length}</p>
            <p className="text-[11px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest mt-2">Variedades ativas</p>
         </motion.div>

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="editorial-card p-6">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 rounded-xl bg-[var(--ivani-blue)]/10 text-[var(--ivani-blue)] flex items-center justify-center"><History size={20} /></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-60">Fluxo 24h</span>
            </div>
            <p className="text-4xl font-black text-[var(--ivani-text)] tracking-tight">{movimentacoes.filter(m => new Date(m.created_at) > new Date(Date.now() - 86400000)).length}</p>
            <p className="text-[11px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest mt-2">Movimentações recentes</p>
         </motion.div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-4">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-black text-red-700">{error.message}</p>
            {error.hint && <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-widest">{error.hint}</p>}
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors text-red-400">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Tab Selector ─────────────────────────────────────────────────── */}
      <div className="inline-flex p-1.5 bg-[var(--ivani-bg)]/60 rounded-2xl border border-[var(--ivani-border)] mb-8">
        {[
          { id: "cards", label: "Visão Geral", icon: <LayoutGrid size={16} /> },
          { id: "historico", label: "Movimentações", icon: <List size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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
              <div className="col-span-full py-24 editorial-card flex flex-col items-center border-dashed border-2">
                <div className="w-20 h-20 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6 hand-drawn-border">
                  <Package size={32} />
                </div>
                <h3 className="text-lg font-black text-[var(--ivani-text)] mb-2">Estoque Vazio</h3>
                <p className="text-sm text-[var(--ivani-muted)] max-w-sm text-center font-medium mb-8 leading-relaxed">
                  Não há saldo calculado no momento. Clique no botão de reprocessar para atualizar o inventário.
                </p>
                <button onClick={handleSync} className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--ivani-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <RefreshCcw size={14} />
                  Processar Agora
                </button>
              </div>
            ) : (
              estoque.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -5 }}
                  className="editorial-card group hover:border-[var(--ivani-teal)]/30 transition-all flex flex-col"
                >
                  <div className="p-6 pb-0 flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-[var(--ivani-bg)] rounded-2xl flex items-center justify-center text-[var(--ivani-muted)] group-hover:bg-[var(--ivani-teal)]/10 group-hover:text-[var(--ivani-teal)] transition-colors">
                      <Package size={24} />
                    </div>
                    <button
                      onClick={() => openSaidaModal(item)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 shadow-sm"
                    >
                      Registrar Saída
                    </button>
                  </div>

                  <div className="px-6 mb-6 flex-1">
                    <h3 className="text-lg font-black text-[var(--ivani-text)] tracking-tight mb-2 leading-tight">
                      {getNome(item)}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.modelo_pallet?.codigo && (
                        <span className="px-2.5 py-1 bg-[var(--ivani-bg)] text-[var(--ivani-muted)] rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {item.modelo_pallet.codigo}
                        </span>
                      )}
                      {item.modelo_pallet?.medidas && (
                        <span className="text-[10px] font-bold text-[var(--ivani-muted)] opacity-60">
                           {item.modelo_pallet.medidas}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 mt-auto">
                    <div className="bg-[var(--ivani-bg)]/40 rounded-2xl p-5 border border-[var(--ivani-border)] group-hover:bg-white transition-colors">
                      <p className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] mb-2">Disponível em Pátio</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-[var(--ivani-text)]">
                          {getQty(item).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-xs font-bold text-[var(--ivani-muted)] uppercase">unidades</span>
                      </div>
                    </div>
                    {item.updated_at && (
                      <div className="flex items-center gap-2 mt-4 text-[9px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest opacity-50">
                        <History size={10} />
                        Sincronizado: {fmtDate(item.updated_at)}
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
              <div className="py-24 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-2xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6"><History size={28} /></div>
                 <p className="text-sm font-black text-[var(--ivani-muted)] uppercase tracking-widest">Sem movimentações recentes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                      {["Data", "Modelo de Pallet", "Natureza", "Quantidade", "Justificativa"].map((h) => (
                        <th key={h} className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ivani-border)]">
                    {movimentacoes.map((mov, idx) => (
                      <tr key={mov.id} className="hover:bg-[var(--ivani-bg)]/30 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <Calendar size={14} className="text-[var(--ivani-muted)]" />
                              <span className="text-xs font-bold text-[var(--ivani-text)]">{fmtDate(mov.created_at)}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-[var(--ivani-text)] uppercase">{mov.modelo_pallet?.nome ?? "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              mov.tipo === "entrada"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}
                          >
                            {mov.tipo === "entrada" ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                            {mov.tipo}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-black ${mov.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                            {mov.tipo === "saida" ? "-" : "+"}{Number(mov.quantidade).toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-[10px] font-bold text-[var(--ivani-muted)] italic leading-relaxed truncate group-hover:whitespace-normal" title={mov.descricao}>
                            {mov.descricao}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-6 py-4 border-t border-[var(--ivani-border)] bg-[var(--ivani-bg)]/20">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest">Listando {movimentacoes.length} registros</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Saída ─────────────────────────────────────────────── */}
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
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-[var(--ivani-border)] z-[110] overflow-hidden"
            >
              <div className="h-2 bg-red-500" />
              
              <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 hand-drawn-border">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[var(--ivani-text)] tracking-tight">Baixa de Estoque</h3>
                    <p className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest mt-1">
                      {getNome(selectedItem)} · Saldo: {getQty(selectedItem)} un
                    </p>
                  </div>
                </div>
                <button onClick={closeSaidaModal} className="p-3 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] hover:text-red-500 rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 pt-4 space-y-8">
                {/* Quantidade Control */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1 block">Quantidade para Retirada</label>
                  <div className="flex items-center gap-4 p-2 bg-[var(--ivani-bg)] rounded-[2rem] border border-[var(--ivani-border)]">
                    <button
                      type="button"
                      onClick={() => setOutflowQty(Math.max(0, outflowQty - 10))}
                      className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-[var(--ivani-border)] text-[var(--ivani-muted)] hover:text-red-500 hover:border-red-100 transition-all active:scale-90 shadow-sm"
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={outflowQty}
                      onChange={(e) => setOutflowQty(Number(e.target.value))}
                      className="flex-1 bg-transparent border-none text-3xl font-black text-center outline-none text-[var(--ivani-text)] placeholder:text-[var(--ivani-muted)]/20"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => setOutflowQty(outflowQty + 10)}
                      className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-[var(--ivani-border)] text-[var(--ivani-muted)] hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-90 shadow-sm"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Justification Field */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1 block">Motivo da Movimentação</label>
                  <textarea
                    value={outflowDesc}
                    onChange={(e) => setOutflowDesc(e.target.value)}
                    className="w-full bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-[1.5rem] px-5 py-4 text-sm font-medium focus:bg-white focus:border-[var(--ivani-primary)] outline-none transition-all min-h-[120px] resize-none text-[var(--ivani-text)]"
                    placeholder="Descreva o destino ou motivo desta saída (ex: Venda Cliente X, Transferência Unidade Y)..."
                  />
                </div>

                {/* Confirm Actions */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={closeSaidaModal}
                    disabled={submittingSaida}
                    className="flex-1 py-4 bg-white border border-[var(--ivani-border)] text-[var(--ivani-muted)] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[var(--ivani-bg)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaida}
                    disabled={submittingSaida || outflowQty <= 0}
                    className="flex-[2] py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-[0_12px_30px_-5px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submittingSaida ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {submittingSaida ? "Processando..." : "Confirmar Baixa"}
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
