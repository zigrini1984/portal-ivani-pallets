"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Receipt, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  Plus,
  Loader2,
  ArrowLeft,
  LogOut,
  ChevronRight,
  DollarSign,
  Briefcase,
  Layers,
  Check
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { LoadingScreen } from "@/components/ui/loading-screen";

const supabase = createClient();

interface Faturamento {
  id: string;
  quantidade: number;
  data_saida: string;
  valor_total_estimado: number;
  status: string;
  modelo_pallet: {
    nome: string;
    codigo: string;
  };
  estoque_movimentacao_id: string;
  parcelas: Parcela[];
}

interface Parcela {
  id: string;
  numero_parcela: number;
  data_vencimento: string;
  valor_estimado: number;
  status: 'para_vencer' | 'ok' | 'vencido';
  data_ok: string | null;
}

interface SaidaPendente {
  id: string;
  quantidade: number;
  created_at: string;
  modelo_pallet_id: string;
  modelo_pallet: {
    nome: string;
    codigo: string;
    preco_reforma: number;
    preco_remanufatura: number;
  };
  origem: string;
}

export default function AdminFaturamentoPage() {
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [saidasPendentes, setSaidasPendentes] = useState<SaidaPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ativos' | 'pendentes'>('ativos');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar Faturamentos e Parcelas
      const { data: fatData, error: fatError } = await supabase
        .from("faturamentos")
        .select(`
          *,
          modelo_pallet:modelos_pallets(nome, codigo),
          parcelas:faturamento_parcelas(*)
        `)
        .eq("cliente_id", "pce")
        .order("data_saida", { ascending: false });

      if (fatError) throw fatError;

      // 2. Buscar Saídas de Estoque que ainda não estão faturadas
      const { data: allSaidas, error: sError } = await supabase
        .from("estoque_movimentacoes")
        .select(`
          id, quantidade, created_at, modelo_pallet_id, origem,
          modelo_pallet:modelos_pallets(nome, codigo, preco_reforma, preco_remanufatura)
        `)
        .eq("cliente_id", "pce")
        .eq("tipo", "saida")
        .order("created_at", { ascending: false });

      if (sError) throw sError;

      // Filtrar as que já foram faturadas (estoque_movimentacao_id no faturamentos)
      const faturadasIds = new Set(fatData?.map(f => f.estoque_movimentacao_id));
      const pendentes = allSaidas?.filter(s => !faturadasIds.has(s.id)) || [];

      setFaturamentos(fatData || []);
      setSaidasPendentes(pendentes as any);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao carregar dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGerarFaturamento = async (saida: SaidaPendente) => {
    try {
      const precoRef = saida.modelo_pallet.preco_reforma || saida.modelo_pallet.preco_remanufatura || 0;
      const valorTotal = saida.quantidade * precoRef;

      // 1. Criar Faturamento
      const { data: fat, error: fError } = await supabase
        .from("faturamentos")
        .insert([{
          cliente_id: 'pce',
          estoque_movimentacao_id: saida.id,
          modelo_pallet_id: saida.modelo_pallet_id,
          data_saida: saida.created_at,
          quantidade: saida.quantidade,
          valor_total_estimado: valorTotal,
          status: 'pendente'
        }])
        .select()
        .single();

      if (fError) throw fError;

      // 2. Criar 2 Parcelas (30 e 60 dias)
      const dataSaida = new Date(saida.created_at);
      const p1Data = new Date(dataSaida); p1Data.setDate(p1Data.getDate() + 30);
      const p2Data = new Date(dataSaida); p2Data.setDate(p2Data.getDate() + 60);

      const parcelas = [
        {
          faturamento_id: fat.id,
          numero_parcela: 1,
          data_vencimento: p1Data.toISOString(),
          valor_estimado: valorTotal / 2,
          status: 'para_vencer'
        },
        {
          faturamento_id: fat.id,
          numero_parcela: 2,
          data_vencimento: p2Data.toISOString(),
          valor_estimado: valorTotal / 2,
          status: 'para_vencer'
        }
      ];

      const { error: pError } = await supabase
        .from("faturamento_parcelas")
        .insert(parcelas);

      if (pError) throw pError;

      await fetchData();
      alert("Faturamento gerado com sucesso!");
    } catch (err: any) {
      alert("Erro: " + err.message);
    }
  };

  const handleMarcarOk = async (parcela: Parcela) => {
    try {
      const { error: upError } = await supabase
        .from("faturamento_parcelas")
        .update({ 
          status: 'ok', 
          data_ok: new Date().toISOString() 
        })
        .eq("id", parcela.id);

      if (upError) throw upError;
      
      await fetchData();
    } catch (err: any) {
      alert("Erro ao atualizar parcela: " + err.message);
    }
  };

  const stats = useMemo(() => {
    const allParcelas = faturamentos.flatMap(f => f.parcelas);
    const hoje = new Date();

    const totalApontado = faturamentos.reduce((acc, f) => acc + Number(f.valor_total_estimado), 0);
    const ok = allParcelas.filter(p => p.status === 'ok').reduce((acc, p) => acc + Number(p.valor_estimado), 0);
    const vencidas = allParcelas.filter(p => p.status !== 'ok' && new Date(p.data_vencimento) < hoje).reduce((acc, p) => acc + Number(p.valor_estimado), 0);
    const paraVencer = allParcelas.filter(p => p.status !== 'ok' && new Date(p.data_vencimento) >= hoje).reduce((acc, p) => acc + Number(p.valor_estimado), 0);

    return { totalApontado, ok, vencidas, paraVencer };
  }, [faturamentos]);

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
                  <Receipt className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Apontamento Financeiro</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin Hub</span>
                </div>
              </div>
            </div>

            <AdminNav />

            <button onClick={() => logout()} className="p-2 text-text-dark/40 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Apontado', value: stats.totalApontado, icon: DollarSign, color: 'text-brand-cyan' },
            { label: 'Para Vencer', value: stats.paraVencer, icon: Clock, color: 'text-amber-500' },
            { label: 'Vencidas', value: stats.vencidas, icon: AlertCircle, color: 'text-red-500' },
            { label: 'Recebido (OK)', value: stats.ok, icon: CheckCircle2, color: 'text-green-500' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl border border-brand-pink/10 p-6 card-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">{item.label}</p>
              <p className={`text-2xl font-black mt-1 ${item.color}`}>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faturamento PCE</h1>
            <p className="text-text-dark/50 text-sm mt-1">Gestão de recebíveis originados de saídas de estoque.</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-brand-pink/10 shadow-sm">
            <button 
              onClick={() => setActiveTab('ativos')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'ativos' ? 'bg-brand-cyan text-white' : 'text-text-dark/40 hover:bg-gray-50'}`}
            >
              Faturamentos
            </button>
            <button 
              onClick={() => setActiveTab('pendentes')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'pendentes' ? 'bg-brand-cyan text-white' : 'text-text-dark/40 hover:bg-gray-50'}`}
            >
              Saídas Pendentes
              {saidasPendentes.length > 0 && <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">{saidasPendentes.length}</span>}
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingScreen 
            message="Processando Faturas" 
            subMessage="Ivani Pallets — Apontamento Financeiro"
          />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'pendentes' ? (
              <motion.div key="pend" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {saidasPendentes.map((saida) => (
                  <div key={saida.id} className="bg-white rounded-3xl border border-brand-pink/20 p-6 card-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-400">
                        <Layers size={24} />
                      </div>
                      <button 
                        onClick={() => handleGerarFaturamento(saida)}
                        className="bg-brand-cyan text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all"
                      >
                        Faturar Saída
                      </button>
                    </div>
                    <h3 className="text-lg font-black text-text-dark mb-1">{saida.modelo_pallet.nome}</h3>
                    <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mb-6">Saída em {new Date(saida.created_at).toLocaleDateString('pt-BR')}</p>
                    <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
                      <span className="text-xs font-bold text-text-dark/40 uppercase">Quantidade</span>
                      <span className="text-xl font-black text-brand-cyan">{saida.quantidade} un</span>
                    </div>
                  </div>
                ))}
                {saidasPendentes.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-brand-pink/30">
                    <CheckCircle2 size={40} className="mx-auto text-green-400 mb-4" />
                    <p className="text-xs font-bold text-text-dark/40 uppercase tracking-widest">Tudo faturado! Nenhuma saída pendente.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden card-shadow">
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Modelo / Data Saída</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Valor Total</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Parcela 1 (30d)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Parcela 2 (60d)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">Status Geral</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-pink/5">
                      {faturamentos.map((fat) => {
                        const p1 = fat.parcelas.find(p => p.numero_parcela === 1);
                        const p2 = fat.parcelas.find(p => p.numero_parcela === 2);
                        const hoje = new Date();

                        const getParcelaStyle = (p?: Parcela) => {
                          if (!p) return "";
                          if (p.status === 'ok') return "bg-green-50 text-green-600 border-green-100";
                          if (new Date(p.data_vencimento) < hoje) return "bg-red-50 text-red-600 border-red-100";
                          return "bg-amber-50 text-amber-600 border-amber-100";
                        };

                        return (
                          <tr key={fat.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-text-dark">{fat.modelo_pallet.nome}</span>
                                <span className="text-[10px] font-bold text-text-dark/30 uppercase">{fat.quantidade} unidades em {new Date(fat.data_saida).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-brand-cyan">R$ {Number(fat.valor_total_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </td>
                            {[p1, p2].map((p, idx) => (
                              <td key={idx} className="px-6 py-4">
                                {p ? (
                                  <div className="flex items-center gap-3">
                                    <div className={`px-2 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tight flex flex-col ${getParcelaStyle(p)}`}>
                                      <span>Venc: {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</span>
                                      <span>R$ {Number(p.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {p.status !== 'ok' && (
                                      <button 
                                        onClick={() => handleMarcarOk(p)}
                                        className="w-8 h-8 rounded-lg bg-gray-50 text-text-dark/20 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"
                                        title="Marcar como Pago"
                                      >
                                        <Check size={16} />
                                      </button>
                                    )}
                                  </div>
                                ) : '-'}
                              </td>
                            ))}
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full ${fat.parcelas.every(p => p.status === 'ok') ? 'bg-green-500' : 'bg-brand-cyan animate-pulse'}`} />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-text-dark/60">
                                   {fat.parcelas.filter(p => p.status === 'ok').length} / 2 Parcelas
                                 </span>
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
