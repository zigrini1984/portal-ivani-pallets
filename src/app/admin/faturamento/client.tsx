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
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";


import { PageShell, KPIGrid, KPICard, AppCard, AppButton, StatusBadge, EmptyState } from "@/components/ui/tropical";

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

interface AdminFaturamentoClientProps {
  initialFaturamentos: Faturamento[];
  initialSaidasPendentes: SaidaPendente[];
}

export function AdminFaturamentoClient({ initialFaturamentos, initialSaidasPendentes }: AdminFaturamentoClientProps) {
  const supabase = createClient();
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>(initialFaturamentos);
  const [saidasPendentes, setSaidasPendentes] = useState<SaidaPendente[]>(initialSaidasPendentes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ativos' | 'pendentes'>('ativos');

  const fetchData = async () => {
    try {
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
    }
  };

  useEffect(() => {
    // Initial fetch done by Server Component
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
    <PageShell
      title="Faturamento PCE"
      subtitle="Gestão de recebíveis originados de saídas de estoque."
      actions={
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-brand-indigo/10 shadow-sm">
          <button 
            onClick={() => setActiveTab('ativos')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'ativos' ? 'bg-brand-aqua text-white shadow-md' : 'text-brand-indigo/60 hover:bg-brand-floral/30'}`}
          >
            Faturamentos
          </button>
          <button 
            onClick={() => setActiveTab('pendentes')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'pendentes' ? 'bg-brand-aqua text-white shadow-md' : 'text-brand-indigo/60 hover:bg-brand-floral/30'}`}
          >
            Saídas Pendentes
            {saidasPendentes.length > 0 && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === 'pendentes' ? 'bg-white text-brand-aqua' : 'bg-brand-orange text-white'}`}>
                {saidasPendentes.length}
              </span>
            )}
          </button>
        </div>
      }
    >
      <KPIGrid>
        <KPICard title="Total Apontado" value={`R$ ${stats.totalApontado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign size={18} />} colorVariant="aqua" />
        <KPICard title="Para Vencer" value={`R$ ${stats.paraVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<Clock size={18} />} colorVariant="orange" />
        <KPICard title="Vencidas" value={`R$ ${stats.vencidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<AlertCircle size={18} />} colorVariant="indigo" />
        <KPICard title="Recebido (OK)" value={`R$ ${stats.ok.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<CheckCircle2 size={18} />} colorVariant="primary" />
      </KPIGrid>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-100 rounded-3xl p-5 flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

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
                <AppCard key={saida.id} className="relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-brand-floral/50 rounded-2xl flex items-center justify-center text-brand-orange">
                      <Layers size={24} />
                    </div>
                    <AppButton 
                      onClick={() => handleGerarFaturamento(saida)}
                      size="sm"
                    >
                      Faturar Saída
                    </AppButton>
                  </div>
                  <h3 className="text-lg font-black text-brand-indigo mb-1">{saida.modelo_pallet.nome}</h3>
                  <p className="text-[10px] font-bold text-brand-indigo/40 uppercase tracking-widest mb-6">Saída em {new Date(saida.created_at).toLocaleDateString('pt-BR')}</p>
                  <div className="bg-[#FAFAFA] border border-brand-indigo/5 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-indigo/40 uppercase">Quantidade</span>
                    <span className="text-xl font-black text-brand-aqua">{saida.quantidade} un</span>
                  </div>
                </AppCard>
              ))}
              {saidasPendentes.length === 0 && (
                <div className="col-span-full">
                  <AppCard>
                    <EmptyState 
                      icon={<CheckCircle2 size={48} />}
                      title="Tudo faturado!"
                      description="Nenhuma saída de estoque pendente para faturamento."
                    />
                  </AppCard>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {faturamentos.length === 0 ? (
                <AppCard>
                  <EmptyState 
                    icon={<Receipt size={48} />}
                    title="Nenhum faturamento"
                    description="As saídas faturadas aparecerão aqui."
                  />
                </AppCard>
              ) : (
                <AppCard noPadding>
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full min-w-[700px] text-left">
                      <thead>
                        <tr className="bg-brand-floral/50 border-b border-brand-indigo/5">
                          <th className="px-6 py-4 text-[10px] font-black text-brand-indigo/50 uppercase tracking-widest">Modelo / Data Saída</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-indigo/50 uppercase tracking-widest">Valor Total</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-indigo/50 uppercase tracking-widest">Parcela 1 (30d)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-indigo/50 uppercase tracking-widest">Parcela 2 (60d)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-brand-indigo/50 uppercase tracking-widest">Status Geral</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-indigo/5">
                        {faturamentos.map((fat) => {
                          const p1 = fat.parcelas.find(p => p.numero_parcela === 1);
                          const p2 = fat.parcelas.find(p => p.numero_parcela === 2);
                          const hoje = new Date();

                          const getParcelaStyle = (p?: Parcela) => {
                            if (!p) return "";
                            if (p.status === 'ok') return "bg-green-50 text-green-600 border-green-100";
                            if (new Date(p.data_vencimento) < hoje) return "bg-red-50 text-red-600 border-red-100";
                            return "bg-brand-orange/10 text-brand-orange border-brand-orange/20";
                          };

                          return (
                            <tr key={fat.id} className="hover:bg-brand-floral/30 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-brand-indigo">{fat.modelo_pallet.nome}</span>
                                  <span className="text-[10px] font-bold text-brand-indigo/40 uppercase mt-1">
                                    {fat.quantidade} un em {new Date(fat.data_saida).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-black text-brand-aqua">
                                  R$ {Number(fat.valor_total_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
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
                                          className="w-8 h-8 rounded-lg bg-[#FAFAFA] text-brand-indigo/20 hover:bg-brand-aqua hover:text-white transition-all flex items-center justify-center border border-brand-indigo/5"
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
                                  <div className={`w-1.5 h-1.5 rounded-full ${fat.parcelas.every(p => p.status === 'ok') ? 'bg-green-500' : 'bg-brand-aqua animate-pulse'}`} />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-indigo/60">
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
                </AppCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </PageShell>
  );
}
