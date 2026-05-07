"use client";

import React from "react";
import { 
  TrendingUp, TrendingDown, Minus, Package, Recycle, 
  Leaf, Wallet, Clock, ArrowRight, BarChart3,
  Calendar, CheckCircle2, AlertCircle, Ship
} from "lucide-react";
import { DashboardKPIs } from "@/lib/kpis";

const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10`}>
        <Icon className={colorClass.replace("bg-", "text-")} size={24} strokeWidth={2.5} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend > 0 ? "text-emerald-600" : "text-amber-600"}`}>
          {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{title}</h3>
      <p className="text-3xl font-black text-neutral-900 tracking-tighter">{value}</p>
      <p className="text-xs font-bold text-neutral-400">{subtitle}</p>
    </div>
  </div>
);

export default function ClientDashboard({ initialKPIs, initialTimeline }: { initialKPIs: DashboardKPIs, initialTimeline: any[] }) {
  const formatCurrency = (val: number) => 
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const formatNumber = (val: number) => 
    val.toLocaleString("pt-BR");

  return (
    <div className="mt-12 space-y-12">
      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Economia Total"
          value={formatCurrency(initialKPIs.financeiro.economia_total)}
          subtitle="Retorno acumulado sobre ativos"
          icon={Wallet}
          colorClass="bg-emerald-500"
          trend={initialKPIs.performance.crescimento_mensal}
        />
        <KpiCard 
          title="Volume Processado"
          value={formatNumber(initialKPIs.operacao.total_processado)}
          subtitle="Pallets triados e recuperados"
          icon={Recycle}
          colorClass="bg-blue-500"
        />
        <KpiCard 
          title="CO₂ Evitado"
          value={`${(initialKPIs.esg.co2_evitado / 1000).toFixed(1)}t`}
          subtitle="Impacto ambiental positivo"
          icon={Leaf}
          colorClass="bg-[#327039]"
        />
        <KpiCard 
          title="Eficiência Operacional"
          value={`${initialKPIs.eficiencia.taxa_reaproveitamento.toFixed(1)}%`}
          subtitle="Índice de circularidade"
          icon={TrendingUp}
          colorClass="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline de Atividades */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-neutral-100 p-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Atividade Recente</h2>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Fluxo de ativos em tempo real</p>
            </div>
            <BarChart3 className="text-neutral-200" size={32} />
          </div>

          <div className="space-y-8">
            {initialTimeline.length > 0 ? (
              initialTimeline.map((item, idx) => (
                <div key={item.id} className="flex gap-6 items-start group">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      item.tipo === "entrada" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {item.tipo === "entrada" ? <Package size={20} /> : <Ship size={20} />}
                    </div>
                    {idx !== initialTimeline.length - 1 && <div className="w-px h-10 bg-neutral-100" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-neutral-800 uppercase tracking-tight">
                          {item.tipo === "entrada" ? "Carga Recebida" : "Ativos Expedidos"}
                        </p>
                        <p className="text-xs font-bold text-neutral-400 mt-0.5">
                          {item.quantidade} unidades • {item.modelo?.nome || "Modelo Padrão"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Clock className="text-neutral-200" size={32} />
                </div>
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Nenhuma atividade registrada no período</p>
              </div>
            )}
          </div>
        </div>

        {/* Insight Card */}
        <div className="space-y-6">
          <div className="bg-neutral-900 rounded-[2.5rem] p-10 text-white shadow-xl shadow-neutral-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Insight de Performance
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-4 leading-tight">Sua economia este mês superou a média.</h3>
              <p className="text-neutral-400 text-sm font-medium leading-relaxed mb-8">
                A taxa de reaproveitamento de {initialKPIs.eficiencia.taxa_reaproveitamento.toFixed(1)}% evitou o corte de aproximadamente {Math.round(initialKPIs.esg.arvores_preservadas)} árvores adultas este período.
              </p>
              <button className="flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:gap-5 transition-all">
                Ver Relatório Completo <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="bg-[#FAFAFA] border-2 border-dashed border-neutral-200 rounded-[2.5rem] p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <Package size={20} className="text-neutral-900" />
              </div>
              <h4 className="text-sm font-black text-neutral-900 uppercase tracking-widest">Próxima Coleta</h4>
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Previsão Estimada</p>
            <p className="text-xl font-black text-neutral-900">Quarta-feira, 14:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
