"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Truck, 
  ClipboardCheck, 
  Hammer, 
  Trash2, 
  DollarSign, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Search,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Wallet,
  ShieldCheck,
  Banknote,
  Leaf,
  Recycle,
  Wind,
  Trees,
  RotateCw,
  Settings,
  List,
  Calendar,
  Info,
  ExternalLink,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Wrench,
  Layers,
  ArrowRightLeft,
  Menu,
  X,
  FileText,
  BarChart3,
  Scale,
  Zap,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { registrarAcesso } from "@/lib/utils/monitoramento";
import { LoadingPage } from "@/components/ui/loading-screen";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { fetchDashboardKPIs, DashboardKPIs } from "@/lib/kpis";

// --- TIPAGEM ---

interface Triagem {
  id: string;
  nf_saida_pce: string;
  data_coleta: string;
  quantidade_total: number;
  quantidade_manutencao: number;
  quantidade_remanufatura: number;
  quantidade_compra_ivani: number;
  quantidade_sucata: number;
  status: 'em_triagem' | 'classificada' | 'finalizada';
  created_at: string;
}

interface EstoqueSaldo {
  modelo_pallet_id: string;
  quantidade_disponivel: number;
  modelo?: {
    nome: string;
    codigo: string;
  }
}

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "error" | "info" }) => {
  const styles = {
    default: "bg-gray-100 text-gray-600 border-gray-200",
    success: "bg-green-50 text-green-600 border-green-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    error: "bg-red-50 text-red-600 border-red-100",
    info: "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[variant]}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-3xl border border-brand-pink/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] ${className}`}>
    {children}
  </div>
);

const supabase = createClient();

export default function ClienteDashboardPCE() {
  const [activeTab, setActiveTab] = useState("overview");
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [estoqueSaldos, setEstoqueSaldos] = useState<EstoqueSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("PCE Logística");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar Dados do Usuário
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("nome")
          .eq("id", session.user.id)
          .single();
        if (perfil?.nome) setUserName(perfil.nome);
      }

      // 2. Buscar KPIs Reais
      const kpiData = await fetchDashboardKPIs("pce");
      setKpis(kpiData);

      // 3. Buscar Dados Operacionais para as outras abas
      const [
        { data: triagensData },
        { data: estoqueData }
      ] = await Promise.all([
        supabase.from("triagens").select("*").eq("cliente_id", "pce").order("data_coleta", { ascending: false }),
        supabase.from("estoque_pallets").select("*, modelo:modelos_pallets(nome, codigo)").eq("cliente_id", "pce")
      ]);

      setTriagens(triagensData || []);
      setEstoqueSaldos(estoqueData || []);

      setError(null);
    } catch (err: any) {
      console.error("Dashboard: Erro no fetchData:", err);
      setError(`Erro ao carregar dados operacionais: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    registrarAcesso("cliente/dashboard");
  }, []);

  const tabs = [
    { id: "overview", label: "Visão Executiva", icon: <BarChart3 size={16} /> },
    { id: "operations", label: "Operações", icon: <ArrowRightLeft size={16} /> },
    { id: "stock", label: "Estoque Disponível", icon: <Package size={16} /> },
  ];

  if (loading) return <LoadingPage />;

  const formatCurrency = (val: number) => 
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const formatPercent = (val: number) => 
    `${val.toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark font-sans pb-20">
      {/* Header Premium PCE */}
      <header className="bg-white border-b border-brand-pink/10 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-cyan rounded-xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                  <BarChart3 className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-base sm:text-lg leading-none text-brand-cyan uppercase tracking-tighter">Portal PCE</span>
                  <span className="text-[9px] font-black text-text-dark/30 uppercase tracking-[0.2em] mt-0.5">Business Intelligence</span>
                </div>
              </div>
              
              <nav className="hidden lg:flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                      ? "bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20" 
                      : "text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/cliente/relatorio"
                className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-brand-pink/5 text-brand-pink rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-pink/10 transition-all border border-brand-pink/10"
              >
                <FileText size={16} />
                Relatório Full
              </Link>

              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-text-dark/60 hover:bg-gray-100 rounded-xl"
              >
                <Menu size={24} />
              </button>

              <button 
                onClick={() => logout()}
                className="hidden sm:flex items-center gap-2 p-2.5 text-text-dark/30 hover:text-red-500 transition-colors hover:bg-red-50 rounded-xl"
                title="Sair"
              >
                <LogOut size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-white z-[70] lg:hidden shadow-2xl border-l border-brand-pink/10 flex flex-col p-8"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-cyan">BI Navigation</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-text-dark/30 hover:text-text-dark">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all ${
                      activeTab === tab.id 
                      ? "bg-brand-cyan text-white shadow-xl shadow-brand-cyan/20" 
                      : "text-text-dark/60 hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {tab.icon}
                      {tab.label}
                    </div>
                  </button>
                ))}

                <div className="my-6 border-t border-brand-pink/5" />
                
                <Link
                  href="/cliente/relatorio"
                  className="flex items-center gap-4 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-brand-pink bg-brand-pink/5 border border-brand-pink/10"
                >
                  <FileText size={18} />
                  Relatório Executivo
                </Link>

                <button
                  onClick={() => logout()}
                  className="flex items-center gap-4 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-red-500 hover:bg-red-50 mt-6"
                >
                  <LogOut size={18} />
                  Encerrar Sessão
                </button>
              </div>

              <div className="mt-auto pt-8 border-t border-brand-pink/5 flex flex-col items-center">
                <div className="w-12 h-1 bg-brand-cyan/20 rounded-full mb-4" />
                <div className="text-[9px] font-black text-text-dark/20 uppercase tracking-[0.2em] italic">Ivani Pallets Intelligence</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && kpis && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
              
              {/* TOPO: CARDS GRANDES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                  titulo="Economia Acumulada"
                  valor={formatCurrency(kpis.financeiro.economia_total)}
                  descricao="Total economizado com recuperação de pallets"
                  icone={DollarSign}
                  cor="green"
                  tendencia={{ valor: "R$ 15k/mês", subindo: true }}
                />
                <KpiCard 
                  titulo="Volume Processado"
                  valor={kpis.operacao.total_processado.toLocaleString()}
                  descricao="Total de pallets triados e classificados"
                  icone={Activity}
                  cor="cyan"
                  tendencia={{ valor: `${kpis.performance.crescimento_mensal.toFixed(0)}%`, subindo: kpis.performance.crescimento_mensal > 0 }}
                />
                <KpiCard 
                  titulo="Taxa de Circularidade"
                  valor={formatPercent(kpis.eficiencia.taxa_reaproveitamento)}
                  descricao="Eficiência de recuperação do material"
                  icone={Recycle}
                  cor="blue"
                  tendencia={{ valor: "Excelente", subindo: true }}
                />
                <KpiCard 
                  titulo="Carbono Evitado"
                  valor={`${(kpis.esg.co2_evitado / 1000).toFixed(1)} t`}
                  descricao="Redução de emissões de CO2 na atmosfera"
                  icone={Wind}
                  cor="purple"
                />
              </div>

              {/* SEÇÃO 1: OPERAÇÃO */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-brand-cyan rounded-full" />
                  <h2 className="text-xl font-black text-text-dark uppercase tracking-tight">Fluxo Operacional</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard titulo="Total Coletado" valor={kpis.operacao.total_coletado} descricao="Pallets retirados da PCE" icone={Truck} cor="cyan" />
                  <KpiCard titulo="Saldo em Estoque" valor={kpis.operacao.total_estoque} descricao="Pallets prontos para retorno" icone={Package} cor="cyan" />
                  <KpiCard titulo="Total Entregue" valor={kpis.operacao.total_entregue} descricao="Pallets retornados à PCE" icone={RotateCw} cor="cyan" />
                  <KpiCard titulo="Ciclo Médio" valor={kpis.operacao.tempo_medio_ciclo} descricao="Tempo médio Coleta -> Triagem" icone={Clock} cor="cyan" />
                </div>
              </section>

              {/* SEÇÃO 2: EFICIÊNCIA */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-brand-pink rounded-full" />
                  <h2 className="text-xl font-black text-text-dark uppercase tracking-tight">Índices de Eficiência</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard titulo="Taxa de Reforma" valor={formatPercent(kpis.eficiencia.taxa_reforma)} descricao="Pallets recuperados via reforma" icone={Hammer} cor="pink" />
                  <KpiCard titulo="Taxa de Remanuf." valor={formatPercent(kpis.eficiencia.taxa_remanufatura)} descricao="Recuperação estrutural profunda" icone={Wrench} cor="pink" />
                  <KpiCard titulo="Taxa de Sucata" valor={formatPercent(kpis.eficiencia.taxa_sucata)} descricao="Perda inevitável de material" icone={Trash2} cor="red" />
                  <KpiCard titulo="Perda Operacional" valor={formatPercent(kpis.eficiencia.perda_operacional)} descricao="Impacto da sucata na coleta bruta" icone={AlertCircle} cor="red" />
                </div>
              </section>

              {/* SEÇÃO 3: FINANCEIRO */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                  <h2 className="text-xl font-black text-text-dark uppercase tracking-tight">Análise Financeira</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard titulo="Custo Evitado" valor={formatCurrency(kpis.financeiro.custo_evitar_novo)} descricao="Valor se todos fossem comprados novos" icone={Banknote} cor="green" />
                  <KpiCard titulo="Economia/Pallet" valor={formatCurrency(kpis.financeiro.economia_por_pallet)} descricao="Economia média por unidade recuperada" icone={Target} cor="green" />
                  <KpiCard titulo="ROI Operação" valor={formatPercent(kpis.financeiro.roi_operacao)} descricao="Retorno sobre investimento em reparos" icone={TrendingUp} cor="green" />
                  <KpiCard titulo="Custo Médio" valor={formatCurrency(kpis.financeiro.custo_medio_pallet)} descricao="Custo médio de manutenção/unidade" icone={Scale} cor="green" />
                </div>
              </section>

              {/* SEÇÃO 4: SUSTENTABILIDADE */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                  <h2 className="text-xl font-black text-text-dark uppercase tracking-tight">Impacto Ambiental (ESG)</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard titulo="Árvores Preservadas" valor={kpis.esg.arvores_preservadas.toFixed(0)} descricao="Estimativa baseada no volume recuperado" icone={Trees} cor="purple" />
                  <KpiCard titulo="Madeira Reutilizada" valor={`${kpis.esg.madeira_reutilizada.toFixed(1)} t`} descricao="Volume de madeira que não foi descartada" icone={Leaf} cor="purple" />
                  <KpiCard titulo="Resíduos Evitados" valor={`${(kpis.esg.residuos_evitar / 1000).toFixed(1)} t`} descricao="Massa de resíduos sólidos desviada" icone={Zap} cor="purple" />
                  <KpiCard titulo="Circularidade Global" valor="Tier 1" descricao="Nível de maturidade em economia circular" icone={Globe} cor="purple" />
                </div>
              </section>

              {/* SEÇÃO 5: PERFORMANCE */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
                  <h2 className="text-xl font-black text-text-dark uppercase tracking-tight">Score de Performance</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <KpiCard titulo="Crescimento Mensal" valor={formatPercent(kpis.performance.crescimento_mensal)} descricao="Variação de volume vs mês anterior" icone={TrendingUp} cor="yellow" />
                  <KpiCard titulo="Índice Performance" valor={kpis.performance.indice_performance.toFixed(1)} descricao="Score consolidado (0-100)" icone={Zap} cor="yellow" />
                  <KpiCard titulo="Status Contratual" valor="SLA 98%" descricao="Nível de serviço operacional" icone={ShieldCheck} cor="yellow" />
                </div>
              </section>

            </motion.div>
          )}

          {activeTab === "operations" && (
            <motion.div key="operations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <Card className="overflow-hidden border-brand-pink/10 shadow-xl">
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full min-w-[850px] text-left border-collapse">
                    <thead>
                      <tr className="bg-bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-text-dark/40 border-b border-brand-pink/5">
                        <th className="px-8 py-6">NF / Carga</th>
                        <th className="px-6 py-6">Data Coleta</th>
                        <th className="px-6 py-6 text-center">Bruto</th>
                        <th className="px-6 py-6 text-center">Recuperado</th>
                        <th className="px-6 py-6 text-center">Sucata</th>
                        <th className="px-6 py-6">Status</th>
                        <th className="px-8 py-6 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-pink/5">
                      {triagens.map((t) => (
                        <tr key={t.id} className="hover:bg-brand-cyan/[0.02] transition-all group">
                          <td className="px-8 py-5 font-black text-xs text-text-dark">{t.nf_saida_pce || "S/ NF"}</td>
                          <td className="px-6 py-5 text-[11px] font-bold text-text-dark/40">{new Date(t.data_coleta).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-5 text-center font-black text-text-dark text-xs">{t.quantidade_total}</td>
                          <td className="px-6 py-5 text-center">
                            <span className="font-black text-brand-cyan text-xs">
                              {(t.quantidade_manutencao || 0) + (t.quantidade_remanufatura || 0) + (t.quantidade_compra_ivani || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="font-black text-red-400 text-xs">{t.quantidade_sucata || 0}</span>
                          </td>
                          <td className="px-6 py-5">
                            <Badge variant={t.status === "finalizada" ? "success" : "warning"}>
                              {t.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="text-brand-cyan hover:text-[#1a6e74] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto group/btn">
                              Detalhes 
                              <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "stock" && (
            <motion.div key="stock" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {estoqueSaldos.map((s, i) => (
                <Card key={i} className="p-8 border-brand-pink/10 hover:border-brand-cyan/30 transition-all group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-black text-base text-text-dark tracking-tight">{s.modelo?.nome || "Modelo Indefinido"}</h4>
                      <p className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em]">{s.modelo?.codigo}</p>
                      <div className="w-8 h-1 bg-brand-cyan/20 rounded-full mt-1" />
                    </div>
                    <div className="w-12 h-12 bg-brand-cyan/5 text-brand-cyan rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package size={24} />
                    </div>
                  </div>
                  <div className="mt-8">
                    <span className="text-[10px] font-black text-text-dark/30 uppercase tracking-[0.15em] block mb-2">Saldo em Estoque</span>
                    <div className="text-4xl font-black text-text-dark tracking-tighter">
                      {s.quantidade_disponivel} 
                      <span className="text-sm font-bold text-text-dark/20 ml-2 uppercase tracking-widest">un</span>
                    </div>
                  </div>
                  <button className="w-full mt-10 py-4 bg-bg-primary hover:bg-brand-cyan hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm border border-brand-pink/5">
                    Solicitar Entrega
                  </button>
                </Card>
              ))}
              {estoqueSaldos.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-3xl border border-dashed border-brand-pink/20">
                  <Package size={64} className="mx-auto text-text-dark/5 mb-6" />
                  <p className="text-xs font-black text-text-dark/30 uppercase tracking-widest">Nenhum saldo em estoque disponível</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-32 py-12 border-t border-brand-pink/10 px-6 text-center">
        <div className="max-w-xs mx-auto mb-6 opacity-20">
           <div className="w-full h-px bg-gradient-to-r from-transparent via-text-dark to-transparent" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-dark/20">
          Ivani Pallets — Intelligence & Circular Economy
        </p>
      </footer>
    </div>
  );
}
