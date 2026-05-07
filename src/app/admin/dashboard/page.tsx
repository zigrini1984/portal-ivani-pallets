import React from "react";
import { 
  Truck, ClipboardList, Wrench, Layers, Banknote, 
  BarChart3, Recycle, Leaf, ShieldCheck, Zap,
  ArrowRight, Bell, Calendar, Activity, 
  ArrowUpRight, Package, Users, CheckCircle2,
  Clock, TrendingUp, ChevronRight, PenTool,
  MoveRight, Check, MapPin
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumBadge,
  PremiumButton
} from "@/components/ui/editorial";

export const dynamic = "force-dynamic";

// ─── Componentes Locais ───────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, trend, color = "var(--ivani-primary)" }: any) {
  return (
    <PremiumCard className="p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 64, strokeWidth: 1 })}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: 2.5 })}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight size={12} />
            {trend}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-[var(--ivani-text)] tracking-tight">{value}</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-50">{label}</p>
        <p className="text-[9px] font-medium text-[var(--ivani-muted)] opacity-40 italic">{sub}</p>
      </div>
    </PremiumCard>
  );
}

function OperacaoPasso({ num, label, desc, icon, color, active }: any) {
  return (
    <div className="flex flex-col items-center text-center relative px-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${active ? 'shadow-lg scale-110' : 'opacity-40 grayscale'}`}
           style={{ backgroundColor: active ? color : 'var(--ivani-bg)', color: active ? 'white' : 'var(--ivani-muted)' }}>
        {icon}
      </div>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] opacity-40 mb-1">{num}</span>
      <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--ivani-text)] mb-2">{label}</h4>
      <p className="text-[9px] text-[var(--ivani-muted)] leading-relaxed max-w-[120px]">{desc}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const clienteId = "pce";
  
  // Data boundaries
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

  // Metrics Fetching
  let stats = {
    coletas: 0,
    triagens: 0,
    manutencao: 0,
    estoque: 0,
    faturamento: 0
  };

  let atividades: any[] = [];

  try {
    const [
      { count: colCount },
      { count: triCount },
      { count: manCount },
      { data: estData },
      { data: actData }
    ] = await Promise.all([
      supabase.from("coletas").select("id", { count: 'exact', head: true }).eq("cliente_id", clienteId).gte("created_at", inicioMes),
      supabase.from("triagens").select("id", { count: 'exact', head: true }).eq("cliente_id", clienteId).gte("created_at", inicioMes),
      supabase.from("manutencoes").select("id", { count: 'exact', head: true }).eq("cliente_id", clienteId).neq("status", "concluida"),
      supabase.from("estoque_pallets").select("quantidade").eq("cliente_id", clienteId),
      supabase.from("triagens").select("id, data_coleta, status, quantidade_total").eq("cliente_id", clienteId).order("created_at", { ascending: false }).limit(5)
    ]);

    stats.coletas = colCount || 0;
    stats.triagens = triCount || 0;
    stats.manutencao = manCount || 0;
    stats.estoque = estData?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0;
    atividades = actData || [];
  } catch (err) {
    console.error("Erro ao buscar estatísticas do dashboard:", err);
  }

  return (
    <div className="space-y-10 pb-20">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
             <PremiumBadge variant="teal">Operação Ativa</PremiumBadge>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--ivani-text)] tracking-tight">Olá, Ivani! 👋</h1>
          <p className="text-[var(--ivani-muted)] text-sm opacity-70">
            Aqui você acompanha tudo o que acontece nas operações da <span className="font-bold text-[var(--ivani-primary)]">PCE</span>.
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white border border-[var(--ivani-border)] rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-primary)]">
                 <MapPin size={16} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-text)]">PCE Componentes</span>
                 <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--ivani-muted)] opacity-50">Cajamar, SP</span>
              </div>
              <ChevronRight size={16} className="text-[var(--ivani-muted)] opacity-30 ml-2" />
           </div>

           <div className="bg-white border border-[var(--ivani-border)] rounded-2xl p-3 shadow-sm hover:bg-[var(--ivani-bg)] transition-colors cursor-pointer relative">
              <Bell size={20} className="text-[var(--ivani-muted)]" />
              <div className="absolute top-3 right-3 w-2 h-2 bg-[var(--ivani-accent)] rounded-full border-2 border-white" />
           </div>
        </div>
      </div>

      {/* 2. Hero Banner */}
      <BicPenBanner 
        title="Cada ciclo importa."
        subtitle="Do recebimento à devolução, transformamos processos manuais em inteligência logística de alta performance. Sua operação em tempo real."
        image="/media__1778175575898.png"
      />

      {/* 3. Ciclo Operacional */}
      <PremiumCard className="p-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
            <TrendingUp size={200} />
         </div>
         
         <div className="flex items-center justify-between mb-12">
            <div>
               <h3 className="text-xl font-bold text-[var(--ivani-text)] tracking-tight">Ciclo Operacional</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--ivani-primary)] opacity-60">Status de Fluxo PCE</p>
            </div>
            <PremiumButton variant="ghost" className="text-[var(--ivani-muted)]">Ver fluxograma completo</PremiumButton>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {/* Connecting Lines (Desktop) */}
            <div className="absolute top-7 left-[10%] right-[10%] h-[1px] border-t-2 border-dashed border-[var(--ivani-border)] hidden md:block z-0" />
            
            <OperacaoPasso 
              num="01" 
              label="Coletamos" 
              desc="Retirada agendada com rastreio de NF." 
              icon={<Truck size={24} />} 
              color="#327039" 
              active 
            />
            <OperacaoPasso 
              num="02" 
              label="Triamos" 
              desc="Classificação técnica por modelo e estado." 
              icon={<ClipboardList size={24} />} 
              color="#F0BE49" 
              active 
            />
            <OperacaoPasso 
              num="03" 
              label="Manutenção" 
              desc="Reforma e remanufatura industrial." 
              icon={<Wrench size={24} />} 
              color="#DD5C36" 
              active 
            />
            <OperacaoPasso 
              num="04" 
              label="Estoque" 
              desc="Saldos reais prontos para expedição." 
              icon={<Layers size={24} />} 
              color="#4A90E2" 
              active 
            />
            <OperacaoPasso 
              num="05" 
              label="Devolução" 
              desc="Retorno faturado ao pátio do cliente." 
              icon={<CheckCircle2 size={24} />} 
              color="#133020" 
              active 
            />
         </div>
      </PremiumCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* 4. Painel Rápido (Cards) */}
         <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)] opacity-50 px-2">Indicadores do Mês</h3>
            <div className="grid grid-cols-1 gap-4">
               <StatCard 
                 label="Coletas no Mês" 
                 value={stats.coletas} 
                 sub="Cargas recebidas em Cajamar" 
                 icon={<Truck />} 
                 trend="+12%" 
                 color="var(--ivani-primary)"
               />
               <StatCard 
                 label="Pallets Triados" 
                 value={stats.triagens} 
                 sub="Processados na triagem técnica" 
                 icon={<ClipboardList />} 
                 trend="+5%" 
                 color="#F0BE49"
               />
               <StatCard 
                 label="Em Manutenção" 
                 value={stats.manutencao} 
                 sub="Aguardando reforma/reman" 
                 icon={<Wrench />} 
                 color="#DD5C36"
               />
               <StatCard 
                 label="Saldo em Estoque" 
                 value={stats.estoque} 
                 sub="Disponível para expedição" 
                 icon={<Package />} 
                 color="#4A90E2"
               />
            </div>
         </div>

         {/* 5. Atividades Recentes e 6. Distribuição */}
         <div className="lg:col-span-2 space-y-8">
            <PremiumCard className="p-8">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-lg font-bold text-[var(--ivani-text)] tracking-tight">Atividades Recentes</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-50">Últimos registros operacionais</p>
                  </div>
                  <div className="p-2 bg-[var(--ivani-bg)] rounded-xl border border-[var(--ivani-border)]/50">
                     <History size={16} className="text-[var(--ivani-muted)] opacity-40" />
                  </div>
               </div>

               <div className="space-y-6">
                  {atividades.length > 0 ? atividades.map((act, i) => (
                    <div key={act.id} className="flex items-center gap-6 group">
                       <div className="w-10 h-10 rounded-xl bg-[var(--ivani-bg)] border border-[var(--ivani-border)]/50 flex items-center justify-center text-[var(--ivani-muted)] group-hover:text-[var(--ivani-primary)] transition-colors">
                          <Activity size={18} />
                       </div>
                       <div className="flex-1 border-b border-[var(--ivani-border)]/30 pb-4">
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="text-[11px] font-bold text-[var(--ivani-text)] uppercase tracking-tight">
                               Triagem #{act.id.slice(0, 8)} - {act.status === 'concluida' ? 'Concluída' : 'Em Aberto'}
                             </h4>
                             <span className="text-[9px] font-medium text-[var(--ivani-muted)] opacity-40">
                                {new Date(act.data_coleta).toLocaleDateString('pt-BR')}
                             </span>
                          </div>
                          <p className="text-[10px] text-[var(--ivani-muted)] opacity-70">
                             Volume total de <span className="font-bold text-[var(--ivani-text)]">{act.quantidade_total}</span> unidades triadas na PCE.
                          </p>
                       </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center">
                       <Clock size={32} className="mx-auto text-[var(--ivani-muted)] opacity-20 mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-40">Nenhuma atividade recente encontrada</p>
                    </div>
                  )}
               </div>

               <PremiumButton variant="ghost" className="w-full mt-8 border-t border-[var(--ivani-border)] pt-6 rounded-none text-[var(--ivani-muted)]">
                  Ver histórico completo de operações <MoveRight size={14} className="ml-2" />
               </PremiumButton>
            </PremiumCard>

            {/* 6. Distribuição Atual (Gráfico Desenhado) */}
            <PremiumCard className="p-8 bg-white border-dashed border-2 border-[var(--ivani-border)]">
               <div className="flex items-center justify-between mb-10">
                  <div>
                     <h3 className="text-lg font-bold text-[var(--ivani-text)] tracking-tight">Distribuição da Operação</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] opacity-50">Volume por estágio de processo</p>
                  </div>
                  <PenTool size={20} className="text-[var(--ivani-muted)] opacity-20" />
               </div>

               <div className="h-48 flex items-end justify-around gap-4 px-4">
                  {[
                    { label: "Coletados", val: stats.coletas * 10, color: "#327039" },
                    { label: "Triados", val: stats.triagens * 8, color: "#F0BE49" },
                    { label: "Manutenção", val: stats.manutencao * 5, color: "#DD5C36" },
                    { label: "Estoque", val: stats.estoque / 10, color: "#4A90E2" },
                    { label: "Faturamento", val: 15, color: "#133020" }
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                       <div 
                         className="w-full max-w-[40px] rounded-t-lg transition-all duration-1000"
                         style={{ 
                           height: `${Math.min(100, bar.val || 5)}%`, 
                           backgroundColor: bar.color,
                           opacity: 0.8,
                           boxShadow: `0 4px 12px ${bar.color}20`
                         }}
                       />
                       <span className="text-[8px] font-black uppercase tracking-tighter text-[var(--ivani-muted)] text-center h-4 flex items-center">{bar.label}</span>
                    </div>
                  ))}
               </div>
               
               <div className="mt-8 pt-6 border-t border-[var(--ivani-border)]/30 flex items-center justify-center gap-8 opacity-40">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[var(--ivani-primary)]" />
                     <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--ivani-text)]">Fluxo Estável</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[var(--ivani-accent)]" />
                     <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--ivani-text)]">Ação Requerida</span>
                  </div>
               </div>
            </PremiumCard>
         </div>
      </div>

      {/* 7. Banner Inferior */}
      <div className="relative w-full overflow-hidden rounded-[3rem] bg-[var(--ivani-text)] p-12 lg:p-16 text-white text-center">
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
         
         <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight italic">
              "Eficiência é fazer o certo hoje para gerar valor sempre."
            </h2>
            <div className="w-24 h-[1px] bg-white/20 mx-auto" />
            <p className="text-sm text-white/50 font-medium uppercase tracking-[0.4em]">Logística Ivani &bull; Industrial Intelligence</p>
            
            <div className="pt-8 flex items-center justify-center gap-12 opacity-30 grayscale invert">
               <Recycle size={32} />
               <Layers size={32} />
               <Truck size={32} />
               <ShieldCheck size={32} />
            </div>
         </div>
         
         {/* Diagrama Estilo Caneta no Background */}
         <div className="absolute bottom-0 right-0 p-10 opacity-5 pointer-events-none">
            <PenTool size={300} strokeWidth={0.5} />
         </div>
      </div>

    </div>
  );
}

function History({ size, className }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
