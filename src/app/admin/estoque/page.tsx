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
import { logout } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { sincronizarEstoqueOperacional } from "@/lib/services/estoque";

const supabase = createClient();

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

export default function AdminEstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await sincronizarEstoqueOperacional(); // Sincronização automática no load
      await fetchData();
    };
    init();
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
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button onClick={() => window.location.href = "/"} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={18} className="text-text-dark/40" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center">
                  <Box className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Gestão de Estoque</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin</span>
                </div>
              </div>
            </div>
            
            <AdminNav />

            <div className="flex items-center gap-3">
               <button 
                onClick={handleSync}
                disabled={syncing}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-brand-pink/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50"
               >
                 {syncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
                 Reprocessar Estoque
               </button>
               <button onClick={() => logout()} className="p-2 text-text-dark/40 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventário de Pallets</h1>
            <p className="text-text-dark/50 text-sm mt-1">Saldo acumulado disponível para o cliente PCE.</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-brand-pink/10 shadow-sm w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('cards')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'cards' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'text-text-dark/40 hover:bg-gray-50'}`}
            >
              <TrendingUp size={16} /> Visão Geral
            </button>
            <button 
              onClick={() => setActiveTab('historico')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'historico' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'text-text-dark/40 hover:bg-gray-50'}`}
            >
              <History size={16} /> Movimentações
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingScreen 
            message="Calculando Saldos" 
            subMessage="Ivani Pallets — Inventário em Tempo Real"
          />
        ) : error ? (
          <div className="py-20 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
            <h3 className="text-lg font-bold text-text-dark/60">{error}</h3>
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
                  <div key={item.id} className="bg-white rounded-3xl border border-brand-pink/20 p-6 card-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-bg-primary rounded-2xl flex items-center justify-center text-text-dark/20 group-hover:text-brand-cyan transition-colors">
                        <Package size={24} />
                      </div>
                      <button 
                        onClick={() => { setSelectedModel(item.modelo_pallet_id); setIsOutflowModalOpen(true); }}
                        className="p-2 px-4 bg-brand-cyan/5 text-brand-cyan rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan hover:text-white transition-all"
                      >
                        Registrar Saída
                      </button>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-black text-text-dark leading-tight mb-1">{item.modelo_pallet?.nome}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-text-dark/40 uppercase tracking-widest">{item.modelo_pallet?.codigo}</span>
                        <div className="w-1 h-1 bg-text-dark/20 rounded-full" />
                        <span className="text-[10px] font-black text-text-dark/40 uppercase tracking-widest">{item.modelo_pallet?.medidas}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-brand-cyan/5 rounded-2xl p-4 border border-brand-cyan/10">
                        <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest block mb-1">Disponível</span>
                        <div className="text-3xl font-black text-brand-cyan">{item.quantidade_disponivel} <span className="text-xs opacity-50 font-bold">un</span></div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest block mb-1">Reservado</span>
                        <div className="text-3xl font-black text-text-dark/20">{item.quantidade_reservada} <span className="text-xs opacity-30 font-bold">un</span></div>
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
                className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden card-shadow"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Data</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Modelo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Tipo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest text-right">Qtd</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-pink/5">
                      {movimentacoes.map((mov) => (
                        <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-text-dark/60">{new Date(mov.created_at).toLocaleString('pt-BR')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-text-dark">{mov.modelo_pallet?.nome}</span>
                          </td>
                          <td className="px-6 py-4">
                             <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
                               ${mov.tipo === 'entrada' ? 'bg-green-50 text-green-600' : mov.tipo === 'saida' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}
                             `}>
                               {mov.tipo === 'entrada' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                               {mov.tipo}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-black ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.tipo === 'saida' ? '-' : '+'}{mov.quantidade}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-medium text-text-dark/40 italic">{mov.descricao}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <AnimatePresence>
        {isOutflowModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOutflowModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Registrar Saída de Estoque</h3>
                    <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mt-0.5">Retirada de Pallets Disponíveis</p>
                  </div>
                </div>
                <button onClick={() => setIsOutflowModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Quantidade de Saída</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setOutflowQty(Math.max(0, outflowQty - 10))} className="p-3 bg-bg-primary rounded-2xl text-text-dark/40 hover:bg-red-50 hover:text-red-500 transition-all"><Minus size={20} /></button>
                    <input 
                      type="number" 
                      value={outflowQty}
                      onChange={(e) => setOutflowQty(Number(e.target.value))}
                      className="flex-1 bg-bg-primary border-none rounded-2xl px-5 py-4 text-2xl font-black text-center focus:ring-2 focus:ring-red-500 transition-all"
                    />
                    <button onClick={() => setOutflowQty(outflowQty + 10)} className="p-3 bg-bg-primary rounded-2xl text-text-dark/40 hover:bg-green-50 hover:text-green-600 transition-all"><Plus size={20} /></button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Descrição / Motivo</label>
                  <textarea 
                    value={outflowDesc}
                    onChange={(e) => setOutflowDesc(e.target.value)}
                    className="w-full bg-bg-primary border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-brand-cyan transition-all min-h-[100px]"
                    placeholder="Ex: Retirada de 100 pallets para uso na produção PCE..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsOutflowModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-sm text-text-dark/40 hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleOutflow}
                    disabled={syncing || outflowQty <= 0}
                    className="flex-[2] bg-red-500 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
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
    </div>
  );
}
