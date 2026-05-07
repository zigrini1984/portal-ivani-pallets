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
  X,
  ChevronDown,
  ArrowUpRight,
  Download,
  Info,
  DollarSign,
  FileText,
  ArrowLeft,
  LogOut,
  ChevronRight,
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
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumButton, 
  PremiumBadge 
} from "@/components/ui/editorial";

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
    <div className="max-w-[1200px] mx-auto pb-20">
      <BicPenBanner 
        title="Controle de Faturamento" 
        subtitle="Gestão de notas fiscais, volumes expedidos e histórico financeiro operacional."
        image="/branding/banner-relatorios.png"
        hueRotate="160deg"
      />

      <div className="flex justify-end mb-12">
        <div className="inline-flex p-1.5 bg-[var(--ivani-bg)]/60 rounded-2xl border border-[var(--ivani-border)]/50 shadow-sm">
          {[
            { id: "ativos", label: "Faturamentos", icon: <LayoutGrid size={16} /> },
            { id: "pendentes", label: "Saídas Pendentes", icon: <Layers size={16} />, count: saidasPendentes.length }
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
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${activeTab === tab.id ? 'bg-[var(--ivani-primary)] text-white' : 'bg-[#DD5C36] text-white shadow-sm shadow-[#DD5C36]/30'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Apontado", value: fmtMoney(stats.totalApontado), icon: <DollarSign size={20} />, color: "var(--ivani-blue)" },
          { label: "Para Vencer", value: fmtMoney(stats.paraVencer), icon: <Clock size={20} />, color: "#F59E0B" },
          { label: "Vencidas", value: fmtMoney(stats.vencidas), icon: <AlertCircle size={20} />, color: "#EF4444" },
          { label: "Recebido (OK)", value: fmtMoney(stats.ok), icon: <CheckCircle2 size={20} />, color: "var(--ivani-teal)" },
        ].map((kpi, idx) => (
          <PremiumCard 
            key={kpi.label} 
            className="p-8 group relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {(kpi.icon as any) && React.cloneElement(kpi.icon as React.ReactElement<any>, { size: 48, strokeWidth: 1.5 })}
             </div>
            <div className="flex items-center justify-between mb-6">
               <div 
                 className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-current/10"
                 style={{ background: `color-mix(in srgb, ${kpi.color} 10%, transparent)`, color: kpi.color }}
               >
                 {kpi.icon}
               </div>
               <div className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-30">Contábil</div>
            </div>
            <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest mb-1.5 opacity-60">{kpi.label}</p>
            <p className="text-2xl font-black text-[var(--ivani-text)] tracking-tight">{kpi.value}</p>
          </PremiumCard>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-10">
            <PremiumCard className="p-5 bg-red-50/50 border-red-100 flex items-center gap-4">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm font-black text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={18} /></button>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[var(--ivani-text)]/20 backdrop-blur-md flex items-center justify-center"
          >
             <div className="flex flex-col items-center gap-6 p-12 bg-white rounded-[3rem] shadow-2xl border border-[var(--ivani-border)]">
                <Loader2 className="text-[var(--ivani-primary)] animate-spin" size={48} />
                <div className="text-center">
                  <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--ivani-text)]">Processando Finanças</p>
                  <p className="text-[10px] font-bold text-[var(--ivani-muted)] mt-2 opacity-60">Conciliando registros com o servidor...</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'pendentes' ? (
          <motion.div 
            key="pend" 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {saidasPendentes.map((saida, idx) => (
              <PremiumCard key={saida.id} className="group flex flex-col hover:border-[var(--ivani-primary)]/40 hover:shadow-xl transition-all duration-500">
                <div className="p-8 pb-0 flex justify-between items-start mb-10">
                  <div className="w-14 h-14 bg-[var(--ivani-bg)] rounded-2xl flex items-center justify-center text-[var(--ivani-muted)] group-hover:bg-[#DD5C36]/10 group-hover:text-[#DD5C36] transition-all duration-500">
                    <Layers size={28} strokeWidth={1.5} />
                  </div>
                  <PremiumButton 
                    onClick={() => handleGerarFaturamento(saida)}
                    icon={<Receipt size={14} />}
                    className="!py-2.5 !px-5 shadow-sm"
                  >
                    Faturar
                  </PremiumButton>
                </div>

                <div className="px-8 mb-8 flex-1">
                  <h3 className="text-xl font-black text-[var(--ivani-text)] tracking-tighter mb-4 leading-tight group-hover:text-[var(--ivani-primary)] transition-colors">{saida.modelo_pallet.nome}</h3>
                  <div className="flex items-center gap-3">
                     <Calendar size={12} className="text-[var(--ivani-muted)] opacity-30" />
                     <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-60">Expedido em {fmtDate(saida.created_at)}</p>
                  </div>
                </div>

                <div className="px-8 pb-8">
                  <div className="bg-[var(--ivani-bg)]/40 rounded-[2rem] p-6 border border-[var(--ivani-border)]/50 group-hover:bg-white transition-all duration-500 flex justify-between items-center shadow-sm">
                    <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.3em] opacity-50">Volume Total</span>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-[var(--ivani-text)] tracking-tighter">{saida.quantidade}</span>
                       <span className="text-[10px] font-black text-[var(--ivani-muted)] uppercase opacity-30">un</span>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            ))}
            {saidasPendentes.length === 0 && (
              <div className="col-span-full py-32 editorial-card flex flex-col items-center border-dashed border-2 opacity-60">
                 <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-teal)] mb-8 hand-drawn-border opacity-40">
                    <CheckCircle2 size={40} strokeWidth={1.5} />
                 </div>
                 <h3 className="text-xl font-black text-[var(--ivani-text)] mb-3 tracking-tight">Conciliação Concluída</h3>
                 <p className="text-sm text-[var(--ivani-muted)] font-medium max-w-sm text-center">Não há saídas de estoque aguardando processamento financeiro no momento.</p>
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
              <div className="py-32 flex flex-col items-center opacity-40">
                 <Receipt size={48} className="text-[var(--ivani-muted)] mb-6 opacity-30" strokeWidth={1.5} />
                 <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.3em]">Nenhum Faturamento Registrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-premium min-w-[1000px]">
                  <thead>
                    <tr>
                      <th>Especificação / Data</th>
                      <th>Valor Contábil</th>
                      <th>Parcela 01 (30d)</th>
                      <th>Parcela 02 (60d)</th>
                      <th className="text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faturamentos.map((fat, idx) => {
                      const p1 = fat.parcelas.find(p => p.numero_parcela === 1);
                      const p2 = fat.parcelas.find(p => p.numero_parcela === 2);
                      const hoje = new Date();

                      return (
                        <tr key={fat.id} className="hover:bg-[var(--ivani-bg)]/20 transition-colors group">
                          <td>
                            <div className="flex items-center gap-5">
                               <div className="w-11 h-11 rounded-2xl bg-white border border-[var(--ivani-border)] flex items-center justify-center text-[var(--ivani-muted)] shadow-sm group-hover:scale-110 transition-transform"><Package size={20} strokeWidth={1.5} /></div>
                               <div className="flex flex-col">
                                 <span className="text-[15px] font-black text-[var(--ivani-text)] tracking-tight">{fat.modelo_pallet.nome}</span>
                                 <span className="text-[10px] font-black text-[var(--ivani-primary)] uppercase tracking-widest opacity-60">
                                   {fat.quantidade} UN em {fmtDate(fat.data_saida)}
                                 </span>
                               </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-lg font-black text-[var(--ivani-primary)] tracking-tighter">
                              {fmtMoney(fat.valor_total_estimado)}
                            </span>
                          </td>
                          {[p1, p2].map((p, pIdx) => (
                            <td key={pIdx}>
                              {p ? (
                                <div className="flex items-center gap-3">
                                  <div className={`px-5 py-3 rounded-2xl border flex flex-col gap-1 shadow-sm transition-all group-hover:shadow-md ${
                                    p.status === 'ok' 
                                      ? "bg-emerald-50/50 text-emerald-700 border-emerald-100" 
                                      : (new Date(p.data_vencimento) < hoje ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50/50 text-amber-700 border-amber-100")
                                  }`}>
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Venc: {fmtDate(p.data_vencimento)}</span>
                                    <span className="text-[11px] font-black tracking-tight">{fmtMoney(p.valor_estimado)}</span>
                                  </div>
                                  {p.status !== 'ok' && (
                                    <PremiumButton
                                      variant="secondary"
                                      onClick={() => handleMarcarOk(p)}
                                      icon={<Check size={14} />}
                                      className="!p-3 !rounded-xl !bg-white hover:!bg-[var(--ivani-primary)] hover:!text-white border-[var(--ivani-border)]"
                                    />
                                  )}
                                </div>
                              ) : <span className="text-[10px] font-bold text-[var(--ivani-muted)] opacity-20">—</span>}
                            </td>
                          ))}
                          <td className="text-right">
                             <div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--ivani-bg)] border border-[var(--ivani-border)]/50 rounded-2xl">
                                <div className={`w-2 h-2 rounded-full ${fat.parcelas.every(p => p.status === 'ok') ? 'bg-[var(--ivani-teal)] shadow-[0_0_8px_var(--ivani-teal)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_orange]'}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-70">
                                  {fat.parcelas.filter(p => p.status === 'ok').length} / 2 Recebido
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
            <div className="px-8 py-6 border-t border-[var(--ivani-border)]/50 bg-[var(--ivani-bg)]/10 flex items-center justify-between">
               <p className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-40">Ledger Operacional Financeiro</p>
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[11px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-2 opacity-60">Status de Liquidação</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
