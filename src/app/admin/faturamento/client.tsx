"use client";

import React, { useState, useMemo } from "react";
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
  Check,
  Package,
  History,
  LayoutGrid,
  List
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BicPenBanner } from "@/components/ui/editorial";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v: string) {
  try { return new Date(v).toLocaleDateString('pt-BR'); } catch { return v; }
}

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  const handleGerarFaturamento = async (saida: SaidaPendente) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarOk = async (parcela: Parcela) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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
    <div className="max-w-[1200px] mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <BicPenBanner 
        title="Controle de Faturamento" 
        subtitle="Gestão de notas fiscais, volumes expedidos e histórico financeiro operacional."
        image="/branding/banner-relatorios.png"
        hueRotate="160deg"
      />

      <div className="flex justify-end mb-10">
        <div className="inline-flex p-1.5 bg-[var(--ivani-bg)]/60 rounded-2xl border border-[var(--ivani-border)]">
          {[
            { id: "ativos", label: "Faturamentos", icon: <LayoutGrid size={16} /> },
            { id: "pendentes", label: "Saídas Pendentes", icon: <Layers size={16} />, count: saidasPendentes.length }
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
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === tab.id ? 'bg-[var(--ivani-primary)] text-white' : 'bg-[#DD5C36] text-white'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Apontado", value: fmtMoney(stats.totalApontado), icon: <DollarSign size={18} />, color: "var(--ivani-blue)" },
          { label: "Para Vencer", value: fmtMoney(stats.paraVencer), icon: <Clock size={18} />, color: "#F59E0B" },
          { label: "Vencidas", value: fmtMoney(stats.vencidas), icon: <AlertCircle size={18} />, color: "#EF4444" },
          { label: "Recebido (OK)", value: fmtMoney(stats.ok), icon: <CheckCircle2 size={18} />, color: "var(--ivani-primary)" },
        ].map((kpi, idx) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="editorial-card p-5 group overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest">{kpi.label}</p>
               <div 
                 className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                 style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
               >
                 {kpi.icon}
               </div>
            </div>
            <p className="text-xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-3xl flex items-center gap-4">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm font-black text-red-700">{error}</p>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <Loader2 className="text-[var(--ivani-primary)] animate-spin" size={40} />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)]">Processando Finanças</p>
           </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'pendentes' ? (
          <motion.div 
            key="pend" 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {saidasPendentes.map((saida) => (
              <motion.div key={saida.id} whileHover={{ y: -5 }} className="editorial-card group overflow-hidden flex flex-col">
                <div className="p-6 pb-0 flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-[var(--ivani-bg)] rounded-2xl flex items-center justify-center text-[var(--ivani-muted)] group-hover:bg-[#DD5C36]/10 group-hover:text-[#DD5C36] transition-colors">
                    <Layers size={24} />
                  </div>
                  <button 
                    onClick={() => handleGerarFaturamento(saida)}
                    className="px-4 py-2 bg-[var(--ivani-primary)] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:shadow-[0_4px_15px_-3px_rgba(31,92,63,0.3)] transition-all active:scale-95"
                  >
                    Faturar Saída
                  </button>
                </div>

                <div className="px-6 mb-6 flex-1">
                  <h3 className="text-lg font-black text-[var(--ivani-text)] tracking-tight mb-2 leading-tight">{saida.modelo_pallet.nome}</h3>
                  <div className="flex items-center gap-2">
                     <Calendar size={12} className="text-[var(--ivani-muted)]" />
                     <p className="text-[10px] font-bold text-[var(--ivani-muted)] uppercase tracking-widest">Saída: {fmtDate(saida.created_at)}</p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="bg-[var(--ivani-bg)]/40 rounded-2xl p-5 border border-[var(--ivani-border)] group-hover:bg-white transition-colors flex justify-between items-center">
                    <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Volume</span>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-2xl font-black text-[var(--ivani-primary)]">{saida.quantidade}</span>
                       <span className="text-xs font-bold text-[var(--ivani-muted)] uppercase">un</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {saidasPendentes.length === 0 && (
              <div className="col-span-full py-24 editorial-card flex flex-col items-center border-dashed border-2">
                 <div className="w-20 h-20 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-teal)] mb-6 hand-drawn-border"><CheckCircle2 size={32} /></div>
                 <h3 className="text-lg font-black text-[var(--ivani-text)] mb-2">Tudo em dia!</h3>
                 <p className="text-sm text-[var(--ivani-muted)] font-medium">Nenhuma saída pendente de faturamento.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="list" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="editorial-card overflow-hidden"
          >
            {faturamentos.length === 0 ? (
              <div className="py-24 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-2xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-muted)] mb-6"><Receipt size={28} /></div>
                 <p className="text-sm font-black text-[var(--ivani-muted)] uppercase tracking-widest">Sem registros financeiros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                      <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Modelo / Data</th>
                      <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">Valor Total</th>
                      <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">P1 (30d)</th>
                      <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">P2 (60d)</th>
                      <th className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] text-right">Conciliação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ivani-border)]">
                    {faturamentos.map((fat, idx) => {
                      const p1 = fat.parcelas.find(p => p.numero_parcela === 1);
                      const p2 = fat.parcelas.find(p => p.numero_parcela === 2);
                      const hoje = new Date();

                      const getParcelaStyle = (p?: Parcela) => {
                        if (!p) return "";
                        if (p.status === 'ok') return "bg-emerald-50 text-emerald-600 border-emerald-100";
                        if (new Date(p.data_vencimento) < hoje) return "bg-red-50 text-red-600 border-red-100";
                        return "bg-amber-50 text-amber-700 border-amber-100";
                      };

                      return (
                        <tr key={fat.id} className="hover:bg-[var(--ivani-bg)]/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white border border-[var(--ivani-border)] flex items-center justify-center text-[var(--ivani-muted)] shadow-sm group-hover:scale-110 transition-transform"><Package size={16} /></div>
                               <div className="flex flex-col">
                                 <span className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{fat.modelo_pallet.nome}</span>
                                 <span className="text-[10px] font-bold text-[var(--ivani-primary)] uppercase opacity-60">
                                   {fat.quantidade} un em {fmtDate(fat.data_saida)}
                                 </span>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-base font-black text-[var(--ivani-primary)]">
                              {fmtMoney(fat.valor_total_estimado)}
                            </span>
                          </td>
                          {[p1, p2].map((p, pIdx) => (
                            <td key={pIdx} className="px-6 py-5">
                              {p ? (
                                <div className="flex items-center gap-2">
                                  <div className={`px-3 py-2 rounded-xl border flex flex-col gap-0.5 ${getParcelaStyle(p)} shadow-sm`}>
                                    <span className="text-[8px] font-black uppercase opacity-60">Venc: {fmtDate(p.data_vencimento)}</span>
                                    <span className="text-[10px] font-black">{fmtMoney(p.valor_estimado)}</span>
                                  </div>
                                  {p.status !== 'ok' && (
                                    <button 
                                      onClick={() => handleMarcarOk(p)}
                                      className="w-8 h-8 rounded-lg bg-white text-[var(--ivani-muted)] hover:bg-[var(--ivani-primary)] hover:text-white transition-all flex items-center justify-center border border-[var(--ivani-border)] active:scale-90"
                                      title="Confirmar Recebimento"
                                    >
                                      <Check size={14} strokeWidth={3} />
                                    </button>
                                  )}
                                </div>
                              ) : <span className="text-[10px] font-bold text-[var(--ivani-muted)] opacity-20">—</span>}
                            </td>
                          ))}
                          <td className="px-6 py-5 text-right">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--ivani-bg)] rounded-full">
                                <div className={`w-1.5 h-1.5 rounded-full ${fat.parcelas.every(p => p.status === 'ok') ? 'bg-[var(--ivani-teal)]' : 'bg-amber-500 animate-pulse'}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)]">
                                  {fat.parcelas.filter(p => p.status === 'ok').length} / 2 Pagas
                                </span>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-6 py-5 border-t border-[var(--ivani-border)] bg-[var(--ivani-bg)]/20 flex items-center justify-between">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest">Controle de Saídas Faturadas</p>
               <p className="text-[11px] font-bold text-[var(--ivani-muted)] uppercase">Total: {faturamentos.length} registros</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
