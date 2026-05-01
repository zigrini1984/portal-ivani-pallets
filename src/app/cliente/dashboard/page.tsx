"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ArrowRightLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";
import { registrarAcesso } from "@/lib/utils/monitoramento";
import { LoadingPage } from "@/components/ui/loading-screen";

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

interface Manutencao {
  id: string;
  triagem_id: string;
  quantidade_recebida: number;
  quantidade_concluida: number;
  quantidade_sucata: number;
  quantidade_pendente: number;
  status: 'pendente' | 'em_andamento' | 'concluida';
}

interface EstoqueSaldo {
  modelo_pallet_id: string;
  quantidade_disponivel: number;
  modelo?: {
    nome: string;
    codigo: string;
  }
}

// --- COMPONENTES DE UI ---

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
  <div className={`bg-white rounded-2xl border border-brand-pink/20 shadow-[0_4px_20px_rgb(0,0,0,0.03)] ${className}`}>
    {children}
  </div>
);

const KPICard = ({ 
  label, 
  value, 
  description, 
  icon, 
  trend, 
  trendUp 
}: { 
  label: string, 
  value: string | number, 
  description: string, 
  icon: React.ReactNode,
  trend?: string,
  trendUp?: boolean,
  color?: string
}) => (
  <Card className="p-6 relative group overflow-hidden border-brand-pink/10 min-h-[160px] flex flex-col justify-between">
    <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 pointer-events-none rotate-12 group-hover:rotate-0">
       {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 140 })}
    </div>
    
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest leading-none">{label}</span>
          <div className="w-6 h-1 bg-brand-cyan/20 rounded-full" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${trendUp ? 'bg-green-50 text-green-600' : 'bg-brand-cyan/5 text-brand-cyan'}`}>
            {trend}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-dark block truncate leading-none" title={String(value)}>
          {value}
        </span>
      </div>
    </div>

    <div className="relative z-10 mt-6">
      <p className="text-[10px] text-text-dark/50 font-medium leading-relaxed border-t border-brand-pink/5 pt-3">
        {description}
      </p>
    </div>
  </Card>
);

const DonutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
      <div className="relative w-28 h-28 rounded-full border-[10px] border-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-text-dark">{total}</div>
          <div className="text-[7px] font-bold text-text-dark/30 uppercase tracking-widest leading-none">Pallets</div>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 w-full">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${d.color}`} />
              <span className="text-text-dark/60 font-semibold">{d.label}</span>
            </div>
            <span className="font-bold text-text-dark/80">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Instância estável do Supabase
const supabase = createClient();

export default function ClienteDashboardPCE() {
  const [activeTab, setActiveTab] = useState("overview");
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [estoqueSaldos, setEstoqueSaldos] = useState<EstoqueSaldo[]>([]);
  const [selectedTriagemId, setSelectedTriagemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("PCE Logística");
  const [kpiView, setKpiView] = useState<any>(null);

  // --- BUSCA DE DADOS ---

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      
      if (user) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("nome, cliente_id")
          .eq("id", user.id)
          .single();
        if (perfil?.nome) setUserName(perfil.nome);
      }

      // 1. Buscar Triagens (O coração da operação para o cliente)
      const { data: triagensData, error: triagemError } = await supabase
        .from("triagens")
        .select("*")
        .eq("cliente_id", "pce")
        .order("data_coleta", { ascending: false });

      if (triagemError) throw triagemError;
      setTriagens(triagensData || []);

      // 2. Buscar Manutenções relacionadas
      const { data: manutencoesData, error: manutencaoError } = await supabase
        .from("manutencoes")
        .select("*")
        .eq("cliente_id", "pce");

      if (manutencaoError) throw manutencaoError;
      setManutencoes(manutencoesData || []);

      // 3. Buscar Saldo de Estoque
      const { data: estoqueData, error: estoqueError } = await supabase
        .from("estoque_pallets")
        .select("*, modelo:modelos_pallets(nome, codigo)")
        .eq("cliente_id", "pce");

      if (estoqueError) throw estoqueError;
      setEstoqueSaldos(estoqueData || []);

      if (triagensData && triagensData.length > 0) setSelectedTriagemId(triagensData[0].id);
      
      // 4. Buscar KPIs Consolidados (View)
      const { data: vData } = await supabase
        .from("dashboard_kpis_pce")
        .select("*")
        .single();
      
      if (vData) setKpiView(vData);

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

  // --- CÁLCULOS DE KPIS ---

  const kpis = useMemo(() => {
    // Usar dados da View se disponíveis, senão fallback (calculado ou zero)
    const totalPallets = kpiView?.total_pallets_processados ?? triagens.reduce((acc, t) => acc + (t.quantidade_total || 0), 0);
    const emProcesso = triagens.filter(t => t.status !== "finalizada").length;
    
    // Recuperação
    const reforma = triagens.reduce((acc, t) => acc + (t.quantidade_manutencao || 0), 0);
    const remanufatura = triagens.reduce((acc, t) => acc + (t.quantidade_remanufatura || 0), 0);
    const compra = triagens.reduce((acc, t) => acc + (t.quantidade_compra_ivani || 0), 0);
    const sucata = kpiView?.total_sucata ?? triagens.reduce((acc, t) => acc + (t.quantidade_sucata || 0), 0);
    
    const economiaVal = kpiView?.economia_total ?? 0;
    const economia = economiaVal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const circularidade = kpiView?.taxa_circularidade ?? 0;

    // Saldo Total em Estoque
    const saldoEstoque = estoqueSaldos.reduce((acc, e) => acc + e.quantidade_disponivel, 0);

    return {
      totalPallets,
      emProcesso,
      economia,
      circularidade: `${circularidade.toFixed(0)}%`,
      saldoEstoque,
      co2: kpiView?.co2_evitado ?? 0,
      madeira: kpiView?.madeira_reaproveitada ?? 0,
      distribuicao: [
        { label: "Manutenção", value: reforma, color: "bg-brand-yellow" },
        { label: "Remanufatura", value: remanufatura, color: "bg-brand-blue" },
        { label: "Compra Ivani", value: compra, color: "bg-green-500" },
        { label: "Sucata", value: sucata, color: "bg-red-400" },
      ]
    };
  }, [triagens, estoqueSaldos, kpiView]);

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: <LayoutDashboard size={16} /> },
    { id: "operations", label: "Operações", icon: <ArrowRightLeft size={16} /> },
    { id: "stock", label: "Estoque Disponível", icon: <Package size={16} /> },
    { id: "environmental", label: "Ambiental (ESG)", icon: <Leaf size={16} /> },
  ];

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark font-sans pb-20">
      {/* Header Premium PCE */}
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-cyan rounded-lg flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                  <Package className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-base sm:text-lg leading-none text-brand-cyan">Portal PCE</span>
                  <span className="text-[9px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets</span>
                </div>
              </div>
              
              <nav className="hidden lg:flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab.id 
                      ? "bg-brand-cyan/5 text-brand-cyan" 
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
              <button 
                onClick={() => logout()}
                className="p-2 text-text-dark/40 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 sm:mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan rounded text-[9px] font-bold uppercase tracking-wider">Fluxo Operacional Real-Time</div>
              <div className="w-1 h-1 bg-text-dark/20 rounded-full" />
              <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">PCE Conectada</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-dark">Painel de Controle Operacional</h1>
            <p className="text-text-dark/50 mt-1.5 text-sm">Acompanhe suas cargas, triagens e saldo de estoque.</p>
          </motion.div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2">
              <Truck size={14} />
              Nova Coleta
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <KPICard 
                  label="Pallets Enviados"
                  value={kpis.totalPallets.toLocaleString()}
                  description="Total bruto coletado na PCE"
                  icon={<Truck />}
                  trend="+14% mês"
                  trendUp={true}
                />
                <KPICard 
                  label="Economia Direta"
                  value={kpis.economia}
                  description="Redução de custo por recuperação"
                  icon={<Wallet />}
                  trend="R$ 12k/mês"
                  trendUp={true}
                />
                <KPICard 
                  label="Circularidade"
                  value={kpis.circularidade}
                  description="Taxa de material reincorporado"
                  icon={<Recycle />}
                  trend="Excelente"
                  trendUp={true}
                />
                <KPICard 
                  label="Saldo Disponível"
                  value={kpis.saldoEstoque}
                  description="Pallets prontos para retorno"
                  icon={<Package />}
                  trend="Estoque"
                  color="purple"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <Card className="lg:col-span-2 p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-lg font-bold">Distribuição do Material</h3>
                      <p className="text-[10px] text-text-dark/40 font-bold uppercase tracking-widest mt-1">Classificação após Triagem</p>
                    </div>
                    <DonutChart data={kpis.distribuicao} />
                  </div>
                </Card>

                <Card className="p-8 bg-brand-cyan/[0.02] border-brand-cyan/20">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan">
                      <Leaf size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Eco-Impacto</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-500 border border-green-50"><Trees size={20} /></div>
                      <div>
                        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Madeira Salva</span>
                        <div className="text-xl font-bold text-text-dark">{kpis.madeira.toFixed(1)} <span className="text-xs font-medium opacity-40">Ton</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-400 border border-blue-50"><Wind size={20} /></div>
                      <div>
                        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">CO2 Evitado</span>
                        <div className="text-xl font-bold text-text-dark">{kpis.co2.toFixed(1)} <span className="text-xs font-medium opacity-40">Ton</span></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "operations" && (
            <motion.div key="operations" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40 border-b border-brand-pink/10">
                        <th className="px-6 py-4">NF / Carga</th>
                        <th className="px-4 py-4">Data Coleta</th>
                        <th className="px-4 py-4 text-center">Material Bruto</th>
                        <th className="px-4 py-4 text-center">Classificação</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-pink/10">
                      {triagens.map((t) => (
                        <tr key={t.id} className="hover:bg-brand-pink/5 transition-all">
                          <td className="px-6 py-5 font-bold text-xs">{t.nf_saida_pce || "S/ NF"}</td>
                          <td className="px-4 py-5 text-[10px] font-medium text-text-dark/40">{new Date(t.data_coleta).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-5 text-center font-bold text-brand-cyan text-xs">{t.quantidade_total}</td>
                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-amber-400" title="Reforma" />
                              <span className="text-[10px] font-bold">{t.quantidade_manutencao}</span>
                              <div className="w-2 h-2 rounded-full bg-brand-blue ml-2" title="Remanufatura" />
                              <span className="text-[10px] font-bold">{t.quantidade_remanufatura}</span>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <Badge variant={t.status === "finalizada" ? "success" : "warning"}>
                              {t.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button className="text-brand-cyan hover:underline text-[10px] font-bold flex items-center gap-1 ml-auto">
                              Detalhes <ChevronRight size={12} />
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
            <motion.div key="stock" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estoqueSaldos.map((s, i) => (
                <Card key={i} className="p-6 border-brand-pink/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-dark">{s.modelo?.nome || "Modelo Indefinido"}</h4>
                      <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-tighter">{s.modelo?.codigo}</p>
                    </div>
                    <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                      <Package size={20} />
                    </div>
                  </div>
                  <div className="mt-6">
                    <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Saldo Disponível</span>
                    <div className="text-3xl font-bold text-text-dark">{s.quantidade_disponivel} <span className="text-xs font-medium text-text-dark/30">un</span></div>
                  </div>
                  <button className="w-full mt-6 py-2.5 bg-gray-50 hover:bg-brand-cyan hover:text-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Solicitar Retorno</button>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === "environmental" && (
            <motion.div key="environmental" className="py-24 text-center">
              <Leaf size={48} className="mx-auto text-brand-cyan/20 mb-4" />
              <p className="text-sm font-bold text-text-dark/40 uppercase tracking-widest">Relatório ESG em processamento...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 py-8 border-t border-brand-pink/20 px-6 text-center text-[10px] font-bold uppercase tracking-widest text-text-dark/30">
        © 2024 Ivani Pallets — Portal PCE Conectado
      </footer>
    </div>
  );
}
