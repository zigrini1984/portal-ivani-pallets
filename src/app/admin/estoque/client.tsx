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
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumButton, 
  PremiumModal, 
  PremiumBadge,
  PremiumInput
} from "@/components/ui/editorial";
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
  
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"cards" | "historico">("cards");
  const [error, setError] = useState<PageError | null>(pageError ?? null);

  // Saída modal state
  const [isOutflowModalOpen, setIsOutflowModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);
  const [outflowQty, setOutflowQty] = useState(0);
  const [outflowDesc, setOutflowDesc] = useState("");
  const [submittingSaida, setSubmittingSaida] = useState(false);

  const totalPallets = useMemo(
    () => initialEstoque.reduce((acc, item) => acc + getQty(item), 0),
    [initialEstoque]
  );

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
      alert(`✅ Estoque reprocessado!\nTotal: ${result.quantidadeTotal} pallets`);
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
        hueRotate="45deg"
      />

      <div className="flex justify-end mb-12">
        <PremiumButton
          onClick={handleSync}
          loading={syncing}
          icon={<RefreshCcw size={18} />}
        >
          Sincronizar Saldo Real
        </PremiumButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         {[
           { 
             label: "Volume em Pátio", 
             val: totalPallets.toLocaleString("pt-BR"), 
             sub: "Unidades para expedição", 
             icon: <Package size={20} />, 
             color: "var(--ivani-primary)",
             dark: true 
           },
           { 
             label: "Modelos Ativos", 
             val: initialEstoque.length, 
             sub: "Variedades em catálogo", 
             icon: <Layers size={20} />, 
             color: "var(--ivani-teal)" 
           },
           { 
             label: "Giro 24h", 
             val: initialMovimentacoes.filter(m => new Date(m.created_at) > new Date(Date.now() - 86400000)).length, 
             sub: "Entradas e saídas recentes", 
             icon: <Activity size={20} />, 
             color: "var(--ivani-blue)" 
           }
         ].map((kpi, i) => (
           <PremiumCard 
             key={kpi.label} 
             className={`p-8 relative group overflow-hidden ${kpi.dark ? 'bg-[var(--ivani-primary)] text-white border-none' : ''}`}
           >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.dark ? 'bg-white/10' : 'bg-[var(--ivani-bg)] text-[var(--ivani-primary)]'}`}>
                     {kpi.icon}
                   </div>
                   <ArrowUpRight size={14} className={kpi.dark ? 'text-white/20' : 'text-[var(--ivani-muted)] opacity-30'} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${kpi.dark ? 'text-white/60' : 'text-[var(--ivani-muted)] opacity-60'}`}>
                  {kpi.label}
                </p>
                <p className="text-4xl font-black tracking-tighter mb-2">{kpi.val}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${kpi.dark ? 'text-white/40' : 'text-[var(--ivani-muted)]/40'}`}>
                  {kpi.sub}
                </p>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700 ${kpi.dark ? 'bg-white' : 'bg-[var(--ivani-primary)]'}`} />
           </PremiumCard>
         ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-10">
            <PremiumCard className="p-5 bg-red-50/50 border-red-100 flex items-start gap-4">
              <AlertCircle className="text-red-500 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm font-black text-red-700">{error.message}</p>
                {error.hint && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-widest">{error.hint}</p>}
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors"><X size={18} /></button>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="inline-flex p-1.5 bg-[var(--ivani-bg)]/60 rounded-2xl border border-[var(--ivani-border)]/50 mb-10">
        {[
          { id: "cards", label: "Catálogo de Pátio", icon: <LayoutGrid size={16} /> },
          { id: "historico", label: "Fluxo Cronológico", icon: <List size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-[var(--ivani-text)] shadow-sm border border-[var(--ivani-border)]"
                : "text-[var(--ivani-muted)] hover:text-[var(--ivani-text)] opacity-60"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {initialEstoque.length === 0 ? (
              <div className="col-span-full py-32 editorial-card flex flex-col items-center border-dashed border-2 opacity-60">
                <Package size={48} className="text-[var(--ivani-muted)] mb-8 opacity-30" strokeWidth={1.5} />
                <h3 className="text-xl font-black text-[var(--ivani-text)] mb-3 tracking-tight">Inventário não Detectado</h3>
                <p className="text-sm text-[var(--ivani-muted)] max-w-sm text-center font-medium mb-10 leading-relaxed">
                  O saldo físico do pátio ainda não foi consolidado. Inicie a sincronização para carregar os dados.
                </p>
                <PremiumButton onClick={handleSync} icon={<RefreshCcw size={16} />}>Sincronizar Agora</PremiumButton>
              </div>
            ) : (
              initialEstoque.map((item, idx) => (
                <PremiumCard
                  key={item.id}
                  className="group flex flex-col hover:border-[var(--ivani-primary)]/40 hover:shadow-xl transition-all duration-500"
                >
                  <div className="p-8 pb-0 flex justify-between items-start mb-10">
                    <div className="w-14 h-14 bg-[var(--ivani-bg)] rounded-2xl flex items-center justify-center text-[var(--ivani-muted)] group-hover:bg-[var(--ivani-primary)]/10 group-hover:text-[var(--ivani-primary)] transition-all duration-500">
                      <Package size={28} strokeWidth={1.5} />
                    </div>
                    <PremiumButton
                      variant="secondary"
                      onClick={() => openSaidaModal(item)}
                      icon={<ArrowRight size={14} />}
                      className="!py-2 !px-4 !text-[8px] border-red-100 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Expedir
                    </PremiumButton>
                  </div>

                  <div className="px-8 mb-8 flex-1">
                    <h3 className="text-2xl font-black text-[var(--ivani-text)] tracking-tighter mb-4 leading-tight group-hover:text-[var(--ivani-primary)] transition-colors">
                      {getNome(item)}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.modelo_pallet?.codigo && (
                        <PremiumBadge variant="default">
                          {item.modelo_pallet.codigo}
                        </PremiumBadge>
                      )}
                      {item.modelo_pallet?.medidas && (
                        <span className="text-[10px] font-black text-[var(--ivani-muted)] opacity-30 uppercase tracking-[0.2em]">
                           {item.modelo_pallet.medidas}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-8 pb-8 mt-auto">
                    <div className="bg-[var(--ivani-bg)]/40 rounded-[2rem] p-8 border border-[var(--ivani-border)]/50 group-hover:bg-[var(--ivani-primary)] transition-all duration-500">
                      <p className="text-[9px] font-black text-[var(--ivani-muted)] group-hover:text-white/60 uppercase tracking-[0.3em] mb-4 opacity-60">Volume em Pátio</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-[var(--ivani-text)] group-hover:text-white tracking-tighter">
                          {getQty(item).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-xs font-black text-[var(--ivani-muted)] group-hover:text-white/50 uppercase tracking-widest opacity-40">un</span>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
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
            {initialMovimentacoes.length === 0 ? (
              <div className="py-32 flex flex-col items-center opacity-40">
                 <History size={48} className="text-[var(--ivani-muted)] mb-6 opacity-30" strokeWidth={1.5} />
                 <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.3em]">Registro Histórico Vazio</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-premium min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Timeline</th>
                      <th>Especificação</th>
                      <th>Fluxo Operacional</th>
                      <th>Volume</th>
                      <th>Observações Técnicas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialMovimentacoes.map((mov) => (
                      <tr key={mov.id} className="hover:bg-[var(--ivani-bg)]/20 transition-colors group">
                        <td>
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{new Date(mov.created_at).toLocaleDateString("pt-BR")}</span>
                              <span className="text-[10px] font-bold text-[var(--ivani-muted)] opacity-40 uppercase tracking-widest">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </td>
                        <td>
                          <span className="text-xs font-black text-[var(--ivani-text)] uppercase tracking-tight group-hover:text-[var(--ivani-primary)] transition-colors">{mov.modelo_pallet?.nome ?? "—"}</span>
                        </td>
                        <td>
                          <PremiumBadge variant={mov.tipo === "entrada" ? "teal" : "orange"}>
                            <span className="flex items-center gap-2">
                               {mov.tipo === "entrada" ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownLeft size={10} strokeWidth={3} />}
                               {mov.tipo}
                            </span>
                          </PremiumBadge>
                        </td>
                        <td>
                          <span className={`text-base font-black tracking-tighter ${mov.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                            {mov.tipo === "saida" ? "− " : "+ "}{Number(mov.quantidade).toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="max-w-xs">
                          <p className="text-[11px] font-medium text-[var(--ivani-muted)] leading-relaxed opacity-60" title={mov.descricao}>
                            {mov.descricao || "Registro automático via sistema."}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-8 py-6 border-t border-[var(--ivani-border)]/50 bg-[var(--ivani-bg)]/10 flex items-center justify-between">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] opacity-40">Timeline Auditada: {initialMovimentacoes.length} movimentações</p>
               <Activity size={16} className="text-[var(--ivani-primary)] opacity-30" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PremiumModal
        isOpen={isOutflowModalOpen}
        onClose={closeSaidaModal}
        title="Expedição de Materiais"
      >
        <div className="space-y-10">
          <div className="p-6 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)]/50 rounded-3xl flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                   <Truck size={24} strokeWidth={1.5} />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-50 mb-1">Item Selecionado</p>
                   <p className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{selectedItem ? getNome(selectedItem) : ""}</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-50 mb-1">Saldo Atual</p>
                <p className="text-xl font-black text-[var(--ivani-text)]">{selectedItem ? getQty(selectedItem) : 0} <span className="text-[10px] opacity-40 uppercase">un</span></p>
             </div>
          </div>

          <div className="space-y-6">
            <label className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] ml-1 opacity-60">Volume para Expedição</label>
            <div className="flex items-center gap-6 p-4 bg-white border-2 border-[var(--ivani-border)]/50 rounded-[2.5rem] focus-within:border-red-500/30 transition-all shadow-sm">
              <button
                type="button"
                onClick={() => setOutflowQty(Math.max(0, outflowQty - 10))}
                className="w-14 h-14 flex items-center justify-center bg-[var(--ivani-bg)] rounded-2xl text-[var(--ivani-muted)] hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
              >
                <Minus size={20} strokeWidth={3} />
              </button>
              <input
                type="number"
                min={0}
                value={outflowQty}
                onChange={(e) => setOutflowQty(Number(e.target.value))}
                className="flex-1 bg-transparent border-none text-5xl font-black text-center outline-none text-[var(--ivani-text)] tracking-tighter"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setOutflowQty(outflowQty + 10)}
                className="w-14 h-14 flex items-center justify-center bg-[var(--ivani-bg)] rounded-2xl text-[var(--ivani-muted)] hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-90"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="label-premium">Observações Operacionais (Opcional)</label>
            <textarea
              value={outflowDesc}
              onChange={(e) => setOutflowDesc(e.target.value)}
              className="input-premium min-h-[120px] py-5 resize-none"
              placeholder="Ex: Destinado ao Cliente X, Carregamento NF 123..."
            />
          </div>

          <div className="pt-8 border-t border-[var(--ivani-border)]/50 flex gap-4">
            <PremiumButton variant="ghost" onClick={closeSaidaModal} disabled={submittingSaida} className="flex-1">
              Descartar
            </PremiumButton>
            <PremiumButton 
              onClick={handleSaida} 
              loading={submittingSaida} 
              disabled={outflowQty <= 0} 
              className="flex-[2] bg-red-600 hover:bg-red-700 shadow-red-200"
            >
              Confirmar Expedição
            </PremiumButton>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}
