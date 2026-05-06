"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ArrowLeft,
  LogOut,
  ChevronRight,
  TrendingUp,
  Box,
  Truck
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { sincronizarEstoqueOperacional } from "@/lib/services/estoque";
import { PageShell, AppCard, AppButton, StatusBadge, EmptyState } from "@/components/ui/tropical";


interface EstoqueItem {
  id: string;
  modelo_pallet_id: string;
  quantidade_disponivel: number;
  quantidade_reservada: number;
  observacao: string;
  modelo_pallet?: {
    nome: string;
    codigo: string;
    medidas: string;
  };
}

interface Movimentacao {
  id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  origem: string;
  descricao: string;
  created_at: string;
  modelo_pallet?: {
    nome: string;
  };
}

interface AdminEstoqueClientProps {
  initialEstoque: EstoqueItem[];
  initialMovimentacoes: Movimentacao[];
}

export function AdminEstoqueClient({ initialEstoque, initialMovimentacoes }: AdminEstoqueClientProps) {
  const supabase = createClient();
  const [estoque, setEstoque] = useState<EstoqueItem[]>(initialEstoque);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(initialMovimentacoes);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'historico'>('cards');
  
  // Saída
  const [isOutflowModalOpen, setIsOutflowModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [outflowQty, setOutflowQty] = useState<number>(0);
  const [outflowDesc, setOutflowDesc] = useState<string>("");

  const fetchData = async () => {
    try {
      const { data: estData, error: estError } = await supabase
        .from("estoque_pallets")
        .select(`
          *,
          modelo_pallet:modelos_pallets(nome, codigo, medidas)
        `)
        .eq("cliente_id", "pce");

      if (estError) throw estError;

      const { data: movData, error: movError } = await supabase
        .from("estoque_movimentacoes")
        .select(`
          *,
          modelo_pallet:modelos_pallets(nome)
        `)
        .eq("cliente_id", "pce")
        .order("created_at", { ascending: false })
        .limit(50);

      if (movError) throw movError;

      setEstoque(estData || []);
      setMovimentacoes(movData || []);
    } catch (err: any) {
      console.error(err);
      setError("Falha ao carregar estoque.");
    }
  };

  useEffect(() => {
    // Initial fetch done by Server Component
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await sincronizarEstoqueOperacional();
      await fetchData();
      alert("Estoque reprocessado com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao sincronizar: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleOutflow = async () => {
    if (!selectedModel || outflowQty <= 0) return;

    const estItem = estoque.find(e => e.modelo_pallet_id === selectedModel);
    if (!estItem || estItem.quantidade_disponivel < outflowQty) {
      alert("Saldo insuficiente para esta saída.");
      return;
    }

    try {
      setSyncing(true);
      
      // Registrar movimentação - O trigger trg_atualizar_saldo_estoque cuidará do saldo no estoque_pallets
      const { error: movErr } = await supabase.from("estoque_movimentacoes").insert([{
        cliente_id: 'pce',
        estoque_id: estItem.id,
        modelo_pallet_id: selectedModel,
        origem: 'saida_manual',
        tipo: 'saida',
        quantidade: outflowQty,
        descricao: outflowDesc || "Saída manual de estoque"
      }]);

      if (movErr) throw movErr;

      setIsOutflowModalOpen(false);
      setOutflowQty(0);
      setOutflowDesc("");
      await fetchData();
    } catch (err: any) {
      alert("Erro ao registrar saída: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <PageShell hideHeader={true}
      title="Inventário de Pallets"
      subtitle="Saldo acumulado disponível para o cliente PCE."
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
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-8">
          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-brand-mirage/10 shadow-sm w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('cards')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'cards' ? 'bg-brand-teal text-brand-mirage shadow-lg shadow-brand-teal/20' : 'text-brand-mirage/40 hover:bg-brand-sand/50'}`}
            >
              <TrendingUp size={16} /> Visão Geral
            </button>
            <button 
              onClick={() => setActiveTab('historico')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'historico' ? 'bg-brand-teal text-brand-mirage shadow-lg shadow-brand-teal/20' : 'text-brand-mirage/40 hover:bg-brand-sand/50'}`}
            >
              <History size={16} /> Movimentações
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-brand-mirage/10">
             <Loader2 className="animate-spin text-brand-teal mb-4" size={48} />
             <h3 className="text-lg font-bold text-brand-mirage">Calculando Saldos</h3>
             <p className="text-sm text-brand-mirage/50 mt-1">Ivani Pallets — Inventário em Tempo Real</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-red-100">
            <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
            <h3 className="text-lg font-bold text-red-600">{error}</h3>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'cards' ? (
              <motion.div 
                key="cards" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {estoque.map((item) => (
                  <div key={item.id} className="bg-white rounded-3xl border border-brand-mirage/10 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-brand-sand/50 rounded-2xl flex items-center justify-center text-brand-mirage/30 group-hover:text-brand-teal transition-colors">
                        <Package size={24} />
                      </div>
                      <button 
                        onClick={() => { setSelectedModel(item.modelo_pallet_id); setIsOutflowModalOpen(true); }}
                        className="px-4 py-2 bg-brand-orange/10 text-brand-orange rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all border border-brand-orange/20 hover:border-brand-orange"
                      >
                        Registrar Saída
                      </button>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-black text-brand-mirage leading-tight mb-1">{item.modelo_pallet?.nome}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-brand-mirage/40 uppercase tracking-widest">{item.modelo_pallet?.codigo}</span>
                        <div className="w-1 h-1 bg-brand-mirage/20 rounded-full" />
                        <span className="text-[10px] font-black text-brand-mirage/40 uppercase tracking-widest">{item.modelo_pallet?.medidas}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-brand-teal/10 rounded-2xl p-4 border border-brand-teal/20">
                        <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest block mb-1">Disponível</span>
                        <div className="text-3xl font-black text-brand-mirage">{item.quantidade_disponivel} <span className="text-xs opacity-50 font-bold">un</span></div>
                      </div>
                      <div className="bg-brand-sand/30 rounded-2xl p-4 border border-brand-mirage/5">
                        <span className="text-[10px] font-bold text-brand-mirage/30 uppercase tracking-widest block mb-1">Reservado</span>
                        <div className="text-3xl font-black text-brand-mirage/40">{item.quantidade_reservada} <span className="text-xs opacity-50 font-bold">un</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="historico"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
              >
                <AppCard>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left">
                      <thead>
                        <tr className="bg-brand-sand/50 border-b border-brand-mirage/5">
                          <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Data</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Modelo</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Tipo</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest text-right">Qtd</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-mirage/5">
                        {movimentacoes.map((mov) => (
                          <tr key={mov.id} className="hover:bg-brand-sand/30 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-brand-mirage/60">{new Date(mov.created_at).toLocaleString('pt-BR')}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-black text-brand-mirage">{mov.modelo_pallet?.nome}</span>
                            </td>
                            <td className="px-6 py-4">
                               <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                                 ${mov.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : mov.tipo === 'saida' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-brand-sand text-brand-mirage/60 border-brand-mirage/10'}
                               `}>
                                 {mov.tipo === 'entrada' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                 {mov.tipo}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`text-sm font-black ${mov.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {mov.tipo === 'saida' ? '-' : '+'}{mov.quantidade}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-medium text-brand-mirage/40 italic">{mov.descricao}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AppCard>
              </motion.div>
            )}
          </AnimatePresence>
        )}

      <AnimatePresence>
        {isOutflowModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOutflowModalOpen(false)} className="absolute inset-0 bg-brand-mirage/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-brand-mirage/10 overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-mirage/5 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight text-brand-mirage">Registrar Saída de Estoque</h3>
                    <p className="text-[10px] font-bold text-brand-mirage/40 uppercase tracking-widest mt-0.5">Retirada de Pallets Disponíveis</p>
                  </div>
                </div>
                <button onClick={() => setIsOutflowModalOpen(false)} className="text-brand-mirage/30 hover:text-brand-mirage transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6 bg-[#FAFAFA]">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-mirage/50 uppercase tracking-widest block">Quantidade de Saída</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setOutflowQty(Math.max(0, outflowQty - 10))} className="p-4 bg-white border border-brand-mirage/10 rounded-2xl text-brand-mirage/40 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"><Minus size={20} /></button>
                    <input 
                      type="number" 
                      value={outflowQty}
                      onChange={(e) => setOutflowQty(Number(e.target.value))}
                      className="flex-1 bg-white border border-brand-mirage/10 rounded-2xl px-5 py-4 text-2xl font-black text-center focus:ring-2 focus:ring-red-500 outline-none transition-all text-brand-mirage"
                    />
                    <button onClick={() => setOutflowQty(outflowQty + 10)} className="p-4 bg-white border border-brand-mirage/10 rounded-2xl text-brand-mirage/40 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all"><Plus size={20} /></button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-brand-mirage/50 uppercase tracking-widest block">Descrição / Motivo</label>
                  <textarea 
                    value={outflowDesc}
                    onChange={(e) => setOutflowDesc(e.target.value)}
                    className="w-full bg-white border border-brand-mirage/10 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-brand-teal outline-none transition-all min-h-[120px] resize-none text-brand-mirage"
                    placeholder="Ex: Retirada de 100 pallets para uso na produção PCE..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <AppButton 
                    onClick={() => setIsOutflowModalOpen(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancelar
                  </AppButton>
                  <button 
                    onClick={handleOutflow}
                    disabled={syncing || outflowQty <= 0}
                    className="flex-[2] bg-red-500 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {syncing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Confirmar Saída
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
