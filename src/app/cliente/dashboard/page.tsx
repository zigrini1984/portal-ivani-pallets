"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard,
  BarChart3,
  Truck,
  Package,
  Recycle,
  DollarSign,
  TrendingUp,
  Leaf,
  ArrowRightLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  FileText,
  Activity,
  Zap,
  Globe,
  Trees,
  Wind,
  Hammer,
  Wrench,
  Trash2,
  AlertCircle,
  Banknote,
  Target,
  Scale,
  Clock,
  RotateCw,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { registrarAcesso } from "@/lib/utils/monitoramento";
import { LoadingPage } from "@/components/ui/loading-screen";
import { fetchDashboardKPIs, DashboardKPIs } from "@/lib/kpis";

// --- COMPONENTES AUXILIARES ---

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "error" | "info" }) => {
  const styles = {
    default: "bg-gray-100 text-gray-500 border-gray-200",
    success: "bg-green-50 text-green-600 border-green-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    error: "bg-red-50 text-red-600 border-red-100",
    info: "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[variant]}`}>
      {children}
    </span>
  );
};

const ExecutiveCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = "cyan" 
}: { 
  title: string, 
  value: string | number, 
  description: string, 
  icon: any,
  trend?: "up" | "down" | "stable",
  trendValue?: string,
  variant?: "cyan" | "pink" | "green" | "purple" | "yellow"
}) => {
  const variants = {
    cyan: "text-brand-cyan bg-brand-cyan/5 border-brand-cyan/10 shadow-brand-cyan/5",
    pink: "text-brand-pink bg-brand-pink/5 border-brand-pink/10 shadow-brand-pink/5",
    green: "text-green-500 bg-green-50 border-green-100 shadow-green-500/5",
    purple: "text-purple-500 bg-purple-50 border-purple-100 shadow-purple-500/5",
    yellow: "text-amber-500 bg-amber-50 border-amber-100 shadow-amber-500/5",
  };

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/20 relative overflow-hidden group"
    >
      <div className={`absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none rotate-12 group-hover:rotate-0 ${variants[variant] || variants.cyan}`}>
        {Icon && <Icon size={140} />}
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${variants[variant] || variants.cyan}`}>
            {Icon && <Icon size={28} />}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              trend === "up" ? "bg-green-50 text-green-600" : trend === "down" ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"
            }`}>
              {trend === "up" ? <ArrowUpRight size={14} /> : trend === "down" ? <ArrowDownRight size={14} /> : <Minus size={14} />}
              {trendValue}
            </div>
          )}
        </div>

        <div>
          <span className="text-[10px] font-black text-text-dark/30 uppercase tracking-[0.2em] block mb-2">{title}</span>
          <div className="text-3xl sm:text-4xl font-black text-text-dark tracking-tighter leading-none mb-4">{value ?? "---"}</div>
          <p className="text-xs text-text-dark/40 font-bold leading-relaxed border-t border-gray-50 pt-5">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ icon: Icon, title, color = "brand-cyan" }: { icon: any, title: string, color?: string }) => (
  <div className="flex items-center gap-4 mb-10">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`} style={{ backgroundColor: color.startsWith('brand') ? `var(--${color})` : color }}>
      {Icon && <Icon size={24} />}
    </div>
    <div className="flex flex-col">
      <h2 className="text-xl font-black text-text-dark uppercase tracking-tight">{title}</h2>
      <div className="w-12 h-1 bg-current opacity-20 rounded-full mt-1" style={{ color: color.startsWith('brand') ? `var(--${color})` : color }} />
    </div>
  </div>
);

const supabase = createClient();

export default function ClienteDashboardPCE() {
  const [activeTab, setActiveTab] = useState("overview");
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [triagens, setTriagens] = useState<any[]>([]);
  const [estoqueSaldos, setEstoqueSaldos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("PCE Logística");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    registrarAcesso("cliente/dashboard");
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse?.data?.session;

      if (session?.user) {
        const { data: perfil } = await supabase.from("usuarios").select("nome").eq("id", session.user.id).single();
        if (perfil?.nome) setUserName(perfil.nome);
      }

      const [kpiData, triagensRes, estoqueRes] = await Promise.all([
        fetchDashboardKPIs("pce"),
        supabase.from("triagens").select("*").eq("cliente_id", "pce").order("data_coleta", { ascending: false }),
        supabase.from("estoque_pallets").select("*, modelo:modelos_pallets(nome, codigo)").eq("cliente_id", "pce")
      ]);

      if (kpiData) setKpis(kpiData);
      setTriagens(triagensRes.data || []);
      setEstoqueSaldos(estoqueRes.data || []);
    } catch (err: any) {
      console.error("Dashboard Error:", err);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = useMemo(() => [
    { id: "overview", label: "Dashboard Executivo", icon: <LayoutDashboard size={16} /> },
    { id: "operations", label: "Gestão Operacional", icon: <ArrowRightLeft size={16} /> },
    { id: "stock", label: "Inventário & Saldo", icon: <Package size={16} /> },
  ], []);

  const formatCurrency = (val: number | undefined | null) => 
    (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const formatPercent = (val: number | undefined | null) => 
    `${(val || 0).toFixed(1)}%`;
  
  const formatNumber = (val: number | undefined | null) => 
    (val || 0).toLocaleString("pt-BR");

  // --- LÓGICA DE INSIGHTS ---
  const insight = useMemo(() => {
    if (!kpis) return null;
    const { eficiencia, financeiro } = kpis;
    
    if ((eficiencia?.taxa_reaproveitamento || 0) > 85) {
      return {
        type: "success",
        title: "Excelência em Circularidade",
        message: "Sua operação apresenta um nível de reaproveitamento excepcional, superando as metas de sustentabilidade do setor B2B.",
        icon: ShieldCheck
      };
    }
    if ((eficiencia?.taxa_sucata || 0) > 15) {
      return {
        type: "warning",
        title: "Oportunidade de Melhoria",
        message: "Detectamos um aumento na geração de sucata. Recomendamos uma revisão nos processos de manuseio interno para reduzir perdas.",
        icon: AlertCircle
      };
    }
    if ((financeiro?.roi_operacao || 0) > 150) {
      return {
        type: "info",
        title: "Alto Retorno sobre Reparo",
        message: "A economia gerada pela recuperação de pallets estruturais está otimizando significativamente o orçamento operacional da PCE.",
        icon: TrendingUp
      };
    }
    return {
      type: "neutral",
      title: "Operação Estabilizada",
      message: "O fluxo de logística reversa mantém constância. Continue monitorando os volumes semanais para identificar tendências de pico.",
      icon: Activity
    };
  }, [kpis]);

  if (!mounted || loading) return <LoadingPage />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-text-dark mb-4">Ops! Algo deu errado.</h2>
          <p className="text-text-dark/50 font-bold mb-8">{error}</p>
          <button onClick={() => fetchData()} className="w-full py-4 bg-brand-cyan text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand-cyan/20">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-text-dark font-sans selection:bg-brand-cyan/20">
      {/* Header Premium PCE */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-cyan rounded-2xl flex items-center justify-center shadow-xl shadow-brand-cyan/20">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-xl leading-none text-brand-cyan tracking-tighter">IVANI HUB</span>
                  <span className="text-[10px] font-black text-text-dark/30 uppercase tracking-[0.2em] mt-1">Strategic Intelligence</span>
                </div>
              </div>
              
              <nav className="hidden lg:flex items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                      ? "bg-text-dark text-white shadow-2xl shadow-text-dark/20" 
                      : "text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[10px] font-black text-text-dark/30 uppercase tracking-widest leading-none mb-1">Bem-vindo, Executivo</span>
                <span className="text-sm font-black text-text-dark">{userName}</span>
              </div>

              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-3 text-text-dark/60 hover:bg-gray-100 rounded-2xl transition-all"
              >
                <Menu size={24} />
              </button>

              <button 
                onClick={() => logout()}
                className="hidden sm:flex items-center gap-3 p-3 text-text-dark/30 hover:text-red-500 transition-all hover:bg-red-50 rounded-2xl"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-text-dark/40 backdrop-blur-md z-[60] lg:hidden" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed top-0 right-0 bottom-0 w-[320px] bg-white z-[70] lg:hidden shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col p-10" >
              <div className="flex justify-between items-center mb-12">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan">Menu Hub</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-text-dark/30"><X size={28} /></button>
              </div>
              <div className="flex flex-col gap-4">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-8 py-6 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.1em] transition-all ${ activeTab === tab.id ? "bg-brand-cyan text-white shadow-2xl shadow-brand-cyan/20" : "text-text-dark/60 hover:bg-gray-50" }`} >
                    <div className="flex items-center gap-4">{tab.icon}{tab.label}</div>
                  </button>
                ))}
              </div>
              <div className="mt-auto flex flex-col items-center">
                <div className="text-[9px] font-black text-text-dark/20 uppercase tracking-[0.3em] italic">Ivani Pallets Ecosystem</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && kpis && (
            <motion.div key="overview" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-24">
              
              {/* 1. HERO EXECUTIVO */}
              <section className="relative">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <Badge variant="success">Operação Circular Ativa</Badge>
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                      <div className="flex items-center gap-2 text-[10px] font-black text-text-dark/40 uppercase tracking-widest">
                        <Calendar size={12} className="text-brand-cyan" />
                        {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-text-dark mb-4">Painel Executivo <span className="text-brand-cyan">PCE</span></h1>
                    <p className="text-lg lg:text-xl text-text-dark/50 font-medium leading-relaxed">Gestão estratégica e inteligência aplicada em logística reversa de ativos. Acompanhe em tempo real o ROI e o impacto sustentável de sua operação.</p>
                  </div>

                  <div className="bg-brand-cyan/[0.03] border border-brand-cyan/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-w-[300px] shadow-2xl shadow-brand-cyan/5">
                    <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] mb-4">Economia Total Gerada</span>
                    <div className="text-4xl lg:text-5xl font-black text-text-dark tracking-tighter mb-2">{formatCurrency(kpis?.financeiro?.economia_total)}</div>
                    <div className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
                      <TrendingUp size={14} />
                      Performance Elevada
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. QUATRO CARDS PRINCIPAIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <ExecutiveCard title="Economia Direta" value={formatCurrency(kpis?.financeiro?.economia_total)} description="Capital preservado através da recuperação estratégica de pallets." icon={DollarSign} variant="green" trend="up" trendValue="+12% vs m.a" />
                <ExecutiveCard title="Pallets Processados" value={formatNumber(kpis?.operacao?.total_processado)} description="Volume total triado e classificado com rigor técnico." icon={Activity} variant="cyan" trend="stable" trendValue="Constante" />
                <ExecutiveCard title="Taxa de Circularidade" value={formatPercent(kpis?.eficiencia?.taxa_reaproveitamento)} description="Eficiência de reincorporação de ativos na cadeia produtiva." icon={Recycle} variant="purple" trend="up" trendValue="Meta Atingida" />
                <ExecutiveCard title="Impacto CO₂" value={`${((kpis?.esg?.co2_evitado || 0) / 1000).toFixed(1)} t`} description="Redução direta da pegada de carbono da operação PCE." icon={Wind} variant="cyan" />
              </div>

              {/* 3. RESUMO COMERCIAL & 5. INSIGHT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 p-10 bg-gray-50/50 border-gray-100 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-8">
                    <Zap size={20} className="text-brand-cyan" />
                    <span className="text-[10px] font-black text-text-dark/30 uppercase tracking-[0.3em]">Resumo Comercial Estratégico</span>
                  </div>
                  <div className="space-y-6">
                    <p className="text-xl lg:text-2xl font-bold text-text-dark leading-snug">
                      A operação recuperou <span className="text-brand-cyan">{formatNumber((kpis?.operacao?.total_processado || 0) - ((kpis?.operacao?.total_processado || 0) * ((kpis?.eficiencia?.taxa_sucata || 0) / 100)))}</span> pallets que poderiam gerar custo de aquisição adicional.
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-text-dark leading-snug">
                      A PCE evitou aproximadamente <span className="text-green-600">{formatCurrency(kpis?.financeiro?.custo_evitar_novo)}</span> em despesas operacionais através do modelo circular.
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-text-dark leading-snug">
                      O reaproveitamento alcançou <span className="text-purple-500">{formatPercent(kpis?.eficiencia?.taxa_reaproveitamento)}</span>, reforçando o compromisso com metas ESG globais.
                    </p>
                  </div>
                </Card>

                {insight && (
                  <motion.div whileHover={{ scale: 1.02 }} className={`p-10 rounded-[2.5rem] border flex flex-col ${
                    insight.type === "success" ? "bg-green-500 text-white border-green-600 shadow-2xl shadow-green-500/20" :
                    insight.type === "warning" ? "bg-amber-500 text-white border-amber-600 shadow-2xl shadow-amber-500/20" :
                    insight.type === "info" ? "bg-brand-cyan text-white border-brand-cyan/20 shadow-2xl shadow-brand-cyan/20" :
                    "bg-text-dark text-white border-gray-800 shadow-2xl shadow-text-dark/20"
                  }`}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <insight.icon size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Insight Ivani</span>
                    </div>
                    <h3 className="text-2xl font-black mb-4 leading-tight">{insight.title}</h3>
                    <p className="text-sm font-bold opacity-80 leading-relaxed mb-8">{insight.message}</p>
                    <button className="mt-auto w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/20">Aprofundar Análise</button>
                  </motion.div>
                )}
              </div>

              {/* 4. SEÇÕES POR PILAR */}
              <div className="space-y-32">
                {/* PILAR OPERAÇÃO */}
                <section>
                  <SectionHeader icon={Truck} title="Performance Operacional" color="brand-cyan" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ExecutiveCard title="Total Coletado" value={formatNumber(kpis?.operacao?.total_coletado)} description="Volume bruto retirado da planta PCE." icon={Truck} variant="cyan" />
                    <ExecutiveCard title="Saldo Ativo" value={formatNumber(kpis?.operacao?.total_estoque)} description="Patrimônio disponível para retorno imediato." icon={Package} variant="cyan" />
                    <ExecutiveCard title="Total Entregue" value={formatNumber(kpis?.operacao?.total_entregue)} description="Volume reintroduzido na cadeia produtiva." icon={RotateCw} variant="cyan" />
                    <ExecutiveCard title="Lead Time" value={kpis?.operacao?.tempo_medio_ciclo} description="Tempo médio entre coleta e triagem técnica." icon={Clock} variant="cyan" />
                  </div>
                </section>

                {/* PILAR EFICIÊNCIA */}
                <section>
                  <SectionHeader icon={Recycle} title="Índices de Eficiência" color="brand-pink" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ExecutiveCard title="Taxa de Reforma" value={formatPercent(kpis?.eficiencia?.taxa_reforma)} description="Recuperação técnica de pallets padrão." icon={Hammer} variant="pink" />
                    <ExecutiveCard title="Taxa de Remanuf." value={formatPercent(kpis?.eficiencia?.taxa_remanufatura)} description="Reforma estrutural de alta complexidade." icon={Wrench} variant="pink" />
                    <ExecutiveCard title="Taxa de Sucata" value={formatPercent(kpis?.eficiencia?.taxa_sucata)} description="Material sem viabilidade técnica de reparo." icon={Trash2} variant="yellow" />
                    <ExecutiveCard title="Perda Total" value={formatPercent(kpis?.eficiencia?.perda_operacional)} description="Impacto da sucata no volume coletado." icon={AlertCircle} variant="yellow" />
                  </div>
                </section>

                {/* PILAR FINANCEIRO */}
                <section>
                  <SectionHeader icon={DollarSign} title="Gestão Financeira" color="green-500" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ExecutiveCard title="Custo Evitado" value={formatCurrency(kpis?.financeiro?.custo_evitar_novo)} description="Economia em evitar aquisição de novos ativos." icon={Banknote} variant="green" />
                    <ExecutiveCard title="Economia/Un" value={formatCurrency(kpis?.financeiro?.economia_por_pallet)} description="Redução média de custo por unidade." icon={Target} variant="green" />
                    <ExecutiveCard title="ROI Estratégico" value={formatPercent(kpis?.financeiro?.roi_operacao)} description="Retorno sobre investimento em manutenção." icon={TrendingUp} variant="green" />
                    <ExecutiveCard title="Custo Unitário" value={formatCurrency(kpis?.financeiro?.custo_medio_pallet)} description="Custo médio fixo de reparo por unidade." icon={Scale} variant="green" />
                  </div>
                </section>

                {/* PILAR ESG */}
                <section>
                  <SectionHeader icon={Leaf} title="Impacto ESG & Sustentabilidade" color="purple-500" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ExecutiveCard title="Árvores Preservadas" value={(kpis?.esg?.arvores_preservadas || 0).toFixed(0)} description="Estimativa de preservação florestal." icon={Trees} variant="purple" />
                    <ExecutiveCard title="Madeira Reaprov." value={`${(kpis?.esg?.madeira_reutilizada || 0).toFixed(1)} t`} description="Volume de matéria-prima reincorporada." icon={Leaf} variant="purple" />
                    <ExecutiveCard title="Resíduos Evitados" value={`${((kpis?.esg?.residuos_evitar || 0) / 1000).toFixed(1)} t`} description="Desvio de resíduos sólidos de aterros." icon={Zap} variant="purple" />
                    <ExecutiveCard title="Compromisso Global" value="Rating AAA" description="Nível de aderência à economia circular." icon={Globe} variant="purple" />
                  </div>
                </section>

                {/* PILAR PERFORMANCE */}
                <section>
                  <SectionHeader icon={Activity} title="Análise de Performance" color="amber-500" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ExecutiveCard title="Crescimento" value={formatPercent(kpis?.performance?.crescimento_mensal)} description="Variação de volume vs período anterior." icon={TrendingUp} variant="yellow" />
                    <ExecutiveCard title="Score Ivani" value={(kpis?.performance?.indice_performance || 0).toFixed(1)} description="Métrica proprietária de eficiência global." icon={Zap} variant="yellow" />
                    <ExecutiveCard title="SLA Operacional" value="98.5%" description="Conformidade com níveis de serviço." icon={ShieldCheck} variant="yellow" />
                  </div>
                </section>
              </div>

            </motion.div>
          )}

          {activeTab === "operations" && (
            <motion.div key="operations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
               <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.3em] text-text-dark/40 border-b border-gray-100">
                        <th className="px-10 py-8">NF / Registro</th>
                        <th className="px-8 py-8">Data Coleta</th>
                        <th className="px-8 py-8 text-center">Volume Bruto</th>
                        <th className="px-8 py-8 text-center">Recuperado</th>
                        <th className="px-8 py-8 text-center">Sucata</th>
                        <th className="px-10 py-8">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {triagens.map((t) => (
                        <tr key={t.id} className="hover:bg-brand-cyan/[0.01] transition-all group">
                          <td className="px-10 py-6 font-black text-sm text-text-dark">{t.nf_saida_pce || "S/ NF"}</td>
                          <td className="px-8 py-6 text-[11px] font-bold text-text-dark/40">{t.data_coleta ? new Date(t.data_coleta).toLocaleDateString('pt-BR') : "---"}</td>
                          <td className="px-8 py-6 text-center font-black text-text-dark text-sm">{t.quantidade_total || 0}</td>
                          <td className="px-8 py-6 text-center">
                            <span className="font-black text-brand-cyan text-sm">
                              {(t.quantidade_manutencao || 0) + (t.quantidade_remanufatura || 0) + (t.quantidade_compra_ivani || 0)}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="font-black text-red-400 text-sm">{t.quantidade_sucata || 0}</span>
                          </td>
                          <td className="px-10 py-6">
                            <Badge variant={t.status === "finalizada" ? "success" : "warning"}>
                              {(t.status || "Pendente").replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "stock" && (
            <motion.div key="stock" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {estoqueSaldos.map((s, i) => (
                <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-2xl shadow-gray-200/20 hover:border-brand-cyan/30 transition-all group">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col">
                      <h4 className="font-black text-lg text-text-dark tracking-tight mb-1">{s.modelo?.nome || "Modelo Indefinido"}</h4>
                      <p className="text-[11px] font-black text-brand-cyan uppercase tracking-[0.2em]">{s.modelo?.codigo || "---"}</p>
                    </div>
                    <div className="w-14 h-14 bg-brand-cyan/5 text-brand-cyan rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                      <Package size={28} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-text-dark/20 uppercase tracking-[0.2em] block mb-2">Saldo em Inventário</span>
                    <div className="text-5xl font-black text-text-dark tracking-tighter">
                      {s.quantidade_disponivel || 0} 
                      <span className="text-base font-bold text-text-dark/20 ml-3 uppercase tracking-widest">un</span>
                    </div>
                  </div>
                  <button className="w-full mt-10 py-5 bg-text-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-text-dark/20">Solicitar Entrega</button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-20 border-t border-gray-100 px-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-dark/20">
          IVANI HUB — THE ART OF LOGISTICS CIRCULARITY
        </p>
      </footer>
    </div>
  );
}

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 ${className}`}>
    {children}
  </div>
);
