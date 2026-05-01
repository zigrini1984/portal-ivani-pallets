"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Leaf, 
  Recycle, 
  Wind, 
  Trees, 
  Wallet, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  ChevronRight,
  Target,
  Award,
  Zap,
  LogOut,
  Truck,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

// --- TIPAGEM ---

interface ExecKPIs {
  total_pallets_processados: number;
  total_recuperados: number;
  total_sucata: number;
  economia_total: number;
  taxa_circularidade: number;
  co2_evitado: number;
  madeira_reaproveitada: number;
}

interface EstoqueItem {
  quantidade_disponivel: number;
  modelo: {
    nome: string;
    codigo: string;
  }
}

const supabase = createClient();

// --- COMPONENTES ---

const StatCard = ({ label, value, icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-6 rounded-[2rem] border border-brand-pink/10 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
        {React.cloneElement(icon, { size: 20, className: color.replace('bg-', 'text-') })}
      </div>
      <div className="text-[10px] font-bold text-text-dark/20 uppercase tracking-widest">Performance</div>
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-2xl font-bold text-text-dark group-hover:text-brand-cyan transition-colors">{value}</span>
    </div>
  </motion.div>
);

export default function RelatorioExecutivoPCE() {
  const [kpis, setKpis] = useState<ExecKPIs | null>(null);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Executivo PCE");

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("nome")
          .eq("id", authData.user.id)
          .single();
        if (perfil?.nome) setUserName(perfil.nome);
      }

      // 1. Buscar KPIs da View
      const { data: kpiData, error: kpiError } = await supabase
        .from("dashboard_kpis_pce")
        .select("*")
        .single();

      if (kpiError) throw kpiError;
      setKpis(kpiData);

      // 2. Buscar Estoque Consolidado
      const { data: estoqueData } = await supabase
        .from("estoque_pallets")
        .select("quantidade_disponivel, modelo:modelos_pallets(nome, codigo)")
        .eq("cliente_id", "pce")
        .gt("quantidade_disponivel", 0);
      
      const formattedEstoque = (estoqueData || []).map((item: any) => ({
        quantidade_disponivel: item.quantidade_disponivel,
        modelo: Array.isArray(item.modelo) ? item.modelo[0] : item.modelo
      }));
      setEstoque(formattedEstoque);

    } catch (err: any) {
      console.error("Relatório Executivo: Erro:", err);
      setError("Falha ao consolidar relatório estratégico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-brand-cyan/20 border-t-brand-cyan rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="text-brand-cyan" size={24} />
            </div>
          </div>
          <p className="text-xs font-bold text-text-dark/40 uppercase tracking-[0.2em] animate-pulse">Consolidando Relatório Executivo</p>
        </div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Relatório Indisponível</h2>
          <p className="text-text-dark/50 text-sm mb-6">{error || "Não foi possível gerar a visão executiva no momento."}</p>
          <button onClick={() => fetchData()} className="px-8 py-3 bg-brand-cyan text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-cyan/20">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20 overflow-x-hidden">
      {/* Top Bar Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-brand-pink/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/cliente/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-all group">
              <ArrowLeft size={18} className="text-text-dark/40 group-hover:text-brand-cyan" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-text-dark leading-none">Relatório Estratégico</h1>
              <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest mt-1">Status: Conectado</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-brand-pink/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-dark/60 hover:border-brand-cyan transition-all">
                <Filter size={14} /> Filtrar Período
             </button>
             <button onClick={() => logout()} className="p-2 text-text-dark/20 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {/* Presentation Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-cyan rounded-2xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                  <Award className="text-white" size={20} />
                </div>
                <div className="px-3 py-1 bg-brand-cyan/10 text-brand-cyan rounded-lg text-[10px] font-bold uppercase tracking-widest">Apresentação Operacional v4.0</div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-dark">Resumo de Performance Executiva</h2>
              <p className="text-text-dark/50 mt-4 text-sm leading-relaxed">
                Este relatório consolida o impacto econômico e ambiental da operação da Ivani Pallets para a <span className="text-brand-cyan font-bold">PCE Logística</span>. Dados atualizados em tempo real baseados em triagens e processos de manutenção.
              </p>
            </motion.div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto px-8 py-4 bg-brand-cyan text-white rounded-2xl text-xs font-bold shadow-xl shadow-brand-cyan/20 flex items-center justify-center gap-3"
          >
            <Download size={16} /> Exportar Apresentação (PDF)
          </motion.button>
        </div>

        {/* HERO KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard 
            label="Economia Direta" 
            value={kpis.economia_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            icon={<Wallet />} 
            color="bg-emerald-500"
            delay={0.1}
          />
          <StatCard 
            label="Taxa Circularidade" 
            value={`${kpis.taxa_circularidade.toFixed(1)}%`} 
            icon={<Recycle />} 
            color="bg-brand-cyan"
            delay={0.2}
          />
          <StatCard 
            label="Madeira Salva" 
            value={`${kpis.madeira_reaproveitada.toFixed(1)} Ton`} 
            icon={<Trees />} 
            color="bg-green-500"
            delay={0.3}
          />
          <StatCard 
            label="CO2 Evitado" 
            value={`${kpis.co2_evitado.toFixed(1)} Ton`} 
            icon={<Wind />} 
            color="bg-blue-400"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
          {/* Resumo Operacional */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-3 bg-white p-10 rounded-[2.5rem] border border-brand-pink/10 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp size={120} />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Target className="text-brand-cyan" size={20} />
                Objetivos Atingidos
              </h3>
              
              <div className="space-y-8">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                    <span className="text-text-dark/40">Pallets Recuperados</span>
                    <span className="text-brand-cyan">{kpis.total_recuperados} / {kpis.total_pallets_processados}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(kpis.total_recuperados / kpis.total_pallets_processados) * 100}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full bg-brand-cyan rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest block mb-2">Volume Bruto</span>
                      <div className="text-2xl font-bold text-text-dark">{kpis.total_pallets_processados} <span className="text-[10px] font-medium opacity-40">unidades</span></div>
                   </div>
                   <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100/50">
                      <span className="text-[10px] font-bold text-red-400/50 uppercase tracking-widest block mb-2">Perda / Sucata</span>
                      <div className="text-2xl font-bold text-red-500">{kpis.total_sucata} <span className="text-[10px] font-medium opacity-40">unidades</span></div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Estoque Disponível */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white p-8 rounded-[2rem] border border-brand-pink/10 shadow-sm h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Estoque Pronto</h3>
                <Package className="text-brand-cyan/20" size={24} />
              </div>
              
              <div className="flex-1 space-y-4">
                {estoque.length > 0 ? estoque.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-brand-cyan/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-dark">{item.modelo.nome}</span>
                      <span className="text-[9px] font-bold text-brand-cyan/60 uppercase">{item.modelo.codigo}</span>
                    </div>
                    <div className="text-xl font-bold text-text-dark group-hover:scale-110 transition-transform">{item.quantidade_disponivel}</div>
                  </div>
                )) : (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="text-text-dark/10" size={24} />
                    </div>
                    <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest leading-relaxed">Nenhum pallet disponível<br/>no estoque de retorno.</p>
                  </div>
                )}
              </div>

              <button className="w-full mt-8 py-4 bg-white border border-brand-pink/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-cyan hover:text-white hover:border-brand-cyan transition-all">
                Solicitar Carregamento
              </button>
            </div>
          </motion.div>
        </div>

        {/* Closing Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-brand-cyan p-10 sm:p-16 rounded-[3rem] text-center relative overflow-hidden shadow-2xl shadow-brand-cyan/30"
        >
          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <Zap className="text-white/40 mx-auto mb-6" size={40} />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">Próximo Nível: Otimização de Retorno</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-10">
              Com base nos dados deste período, sua operação evitou a emissão de mais de <span className="text-white font-bold">{kpis.co2_evitado.toFixed(0)} toneladas de CO2</span>. 
              Estamos prontos para escalar a coleta reversa e aumentar seu ROI em logística.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button className="w-full sm:w-auto px-10 py-4 bg-white text-brand-cyan rounded-2xl text-xs font-bold hover:scale-105 transition-all active:scale-95 shadow-lg">Agendar Reunião Técnica</button>
               <button className="w-full sm:w-auto px-10 py-4 bg-white/10 text-white border border-white/20 rounded-2xl text-xs font-bold hover:bg-white/20 transition-all">Ver Detalhes Técnicos</button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="mt-20 py-12 border-t border-brand-pink/10 text-center">
         <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-brand-cyan rounded-full animate-ping" />
            <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-[0.3em]">Ivani Pallets — Intelligence Suite</span>
         </div>
         <p className="text-[9px] text-text-dark/20 font-medium">Relatório gerado automaticamente em {new Date().toLocaleDateString('pt-BR')} para PCE Logística.</p>
      </footer>
    </div>
  );
}
