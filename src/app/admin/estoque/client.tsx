"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  RefreshCcw,
  Loader2,
  AlertCircle,
  X,
  Save,
  TrendingUp,
  Truck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { reprocessarEstoque, registrarSaidaEstoque } from "@/app/actions/estoque";
import { PageShell, AppCard, AppButton, EmptyState } from "@/components/ui/tropical";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EstoqueItem {
  id: string;
  cliente_id: string;
  modelo_id: string | null;
  modelo_pallet_id: string | null;
  modelo_nome_snapshot: string | null;
  quantidade: number | null;
  quantidade_disponivel: number | null;
  updated_at: string | null;
  modelo_pallet?: { nome?: string; codigo?: string; medidas?: string } | null;
}

interface Movimentacao {
  id: string;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  origem: string;
  descricao: string;
  created_at: string;
  modelo_pallet?: { nome?: string } | null;
}

interface PageError {
  message: string;
  code?: string;
  hint?: string;
}

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
  return (
    item.modelo_pallet?.nome ||
    item.modelo_nome_snapshot ||
    "Modelo não informado"
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminEstoqueClient({
  initialEstoque,
  initialMovimentacoes,
  pageError,
}: AdminEstoqueClientProps) {
  const router = useRouter();
  
  // Use props directly for reactivity with router.refresh()
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

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const result = await reprocessarEstoque();
      if (!result.success) {
        setError({ message: "Erro ao reprocessar: " + result.error });
        return;
      }
      // Sucesso! O router.refresh() vai atualizar as props
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
    if (outflowQty <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }
    const saldo = getQty(selectedItem);
    if (outflowQty > saldo) {
      alert(`Saldo insuficiente. Disponível: ${saldo} unidades.`);
      return;
    }

    try {
      setSubmittingSaida(true);
      const result = await registrarSaidaEstoque({
        estoqueId: selectedItem.id,
        quantidadeSaida: outflowQty,
        observacao: outflowDesc || undefined,
      });

      if (!result.success) {
        alert("Erro: " + result.error);
        return;
      }

      // Sucesso!
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
    <PageShell
      hideHeader={false}
      title="Inventário de Pallets"
      subtitle={`Saldo disponível · ${totalPallets.toLocaleString("pt-BR")} un. total`}
      actions={
        <AppButton
          onClick={handleSync}
          disabled={syncing}
          variant="secondary"
          icon={syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
        >
          Reprocessar
        </AppButton>
      }
    >
      {/* Error banner */}
      {error && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">{error.message}</p>
            {error.hint && <p className="text-xs text-red-500 mt-1">{error.hint}</p>}
            {error.code && (
              <code className="text-[10px] text-red-400 mt-1 block font-mono">
                code: {error.code}
              </code>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-2 bg-white p-1 rounded-2xl border border-[#133020]/10 shadow-sm w-full md:w-auto mb-8 self-start">
        {(["cards", "historico"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? "bg-[#327039] text-white shadow-lg shadow-[#327039]/20"
                : "text-[#133020]/40 hover:bg-[#F8EDD9]/50"
            }`}
          >
            {tab === "cards" ? <TrendingUp size={16} /> : <History size={16} />}
            {tab === "cards" ? "Visão Geral" : "Movimentações"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {estoque.length === 0 ? (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-[#133020]/10 flex flex-col items-center">
                <EmptyState
                  icon={<Package size={48} />}
                  title="Nenhum pallet em estoque"
                  description="Clique em Reprocessar para calcular o saldo a partir das manutenções concluídas."
                />
                <AppButton onClick={handleSync} icon={<RefreshCcw size={16} />} className="mt-6">
                  Reprocessar Agora
                </AppButton>
              </div>
            ) : (
              estoque.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-3xl border border-[#133020]/10 p-6 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-[#F8EDD9]/50 rounded-2xl flex items-center justify-center text-[#133020]/30">
                      <Package size={24} />
                    </div>
                    <button
                      onClick={() => openSaidaModal(item)}
                      className="px-4 py-2 bg-[#DD5C36]/10 text-[#DD5C36] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#DD5C36] hover:text-white transition-all border border-[#DD5C36]/20 hover:border-[#DD5C36]"
                    >
                      Registrar Saída
                    </button>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-black text-[#133020] leading-tight mb-1">
                      {getNome(item)}
                    </h3>
                    {item.modelo_pallet?.codigo && (
                      <span className="text-[10px] font-black text-[#133020]/40 uppercase tracking-widest">
                        {item.modelo_pallet.codigo}
                        {item.modelo_pallet?.medidas && ` · ${item.modelo_pallet.medidas}`}
                      </span>
                    )}
                  </div>

                  <div className="bg-[#327039]/10 rounded-2xl p-4 border border-[#327039]/20">
                    <span className="text-[10px] font-bold text-[#327039] uppercase tracking-widest block mb-1">
                      Disponível
                    </span>
                    <div className="text-3xl font-black text-[#133020]">
                      {getQty(item).toLocaleString("pt-BR")}
                      <span className="text-xs opacity-50 font-bold ml-1.5">un</span>
                    </div>
                  </div>

                  {item.updated_at && (
                    <p className="text-[9px] font-bold text-[#133020]/30 uppercase tracking-widest mt-3">
                      Atualizado: {new Date(item.updated_at).toLocaleString("pt-BR")}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="historico"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AppCard>
              {movimentacoes.length === 0 ? (
                <div className="py-16 flex flex-col items-center">
                  <EmptyState
                    icon={<History size={40} />}
                    title="Sem movimentações"
                    description="Nenhuma movimentação registrada ainda."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left">
                    <thead>
                      <tr className="bg-[#F8EDD9]/50 border-b border-[#133020]/5">
                        {["Data", "Modelo", "Tipo", "Qtd", "Descrição"].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-4 text-[10px] font-black text-[#133020]/50 uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#133020]/5">
                      {movimentacoes.map((mov) => (
                        <tr key={mov.id} className="hover:bg-[#F8EDD9]/30 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-[#133020]/60">
                            {new Date(mov.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-[#133020]">
                            {mov.modelo_pallet?.nome ?? "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                mov.tipo === "entrada"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-red-50 text-red-600 border-red-100"
                              }`}
                            >
                              {mov.tipo === "entrada" ? (
                                <ArrowUpRight size={12} />
                              ) : (
                                <ArrowDownLeft size={12} />
                              )}
                              {mov.tipo}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`text-sm font-black ${
                                mov.tipo === "entrada" ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {mov.tipo === "saida" ? "-" : "+"}
                              {Number(mov.quantidade).toLocaleString("pt-BR")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-medium text-[#133020]/40 italic">
                            {mov.descricao}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AppCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Saída ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOutflowModalOpen && selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSaidaModal}
              className="absolute inset-0 bg-[#133020]/30 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#133020]/10 overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-[#133020]/5 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight text-[#133020]">
                      Registrar Saída de Estoque
                    </h3>
                    <p className="text-[10px] font-bold text-[#133020]/40 uppercase tracking-widest mt-0.5">
                      {getNome(selectedItem)} · Saldo: {getQty(selectedItem)} un
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeSaidaModal}
                  className="text-[#133020]/30 hover:text-[#133020] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6 bg-[#FAFAFA]">
                {/* Quantidade */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#133020]/50 uppercase tracking-widest block">
                    Quantidade de Saída
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setOutflowQty(Math.max(0, outflowQty - 10))}
                      className="p-4 bg-white border border-[#133020]/10 rounded-2xl text-[#133020]/40 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={outflowQty}
                      onChange={(e) => setOutflowQty(Number(e.target.value))}
                      className="flex-1 bg-white border border-[#133020]/10 rounded-2xl px-5 py-4 text-2xl font-black text-center focus:ring-2 focus:ring-red-500 outline-none transition-all text-[#133020]"
                    />
                    <button
                      type="button"
                      onClick={() => setOutflowQty(outflowQty + 10)}
                      className="p-4 bg-white border border-[#133020]/10 rounded-2xl text-[#133020]/40 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Observação */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#133020]/50 uppercase tracking-widest block">
                    Descrição / Motivo
                  </label>
                  <textarea
                    value={outflowDesc}
                    onChange={(e) => setOutflowDesc(e.target.value)}
                    className="w-full bg-white border border-[#133020]/10 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#327039] outline-none transition-all min-h-[100px] resize-none text-[#133020]"
                    placeholder="Ex: Retirada de pallets para uso na produção..."
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={closeSaidaModal}
                    disabled={submittingSaida}
                    className="flex-1 bg-white border border-[#133020]/20 text-[#133020] px-6 py-4 rounded-2xl font-bold text-sm hover:bg-[#133020]/5 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaida}
                    disabled={submittingSaida || outflowQty <= 0}
                    className="flex-[2] bg-red-500 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingSaida ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Save size={20} />
                    )}
                    {submittingSaida ? "Processando..." : "Confirmar Saída"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
