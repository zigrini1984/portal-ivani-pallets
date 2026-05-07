"use client";

import React, { useState, useMemo } from "react";
import { 
  Package, Truck, RotateCw, BarChart3, Clock, 
  Search, Filter, ChevronDown, CheckCircle2, 
  AlertCircle, Layers, Banknote, Calendar,
  ArrowRight, Download, Eye, LayoutDashboard,
  Box, ShieldCheck, Activity, TrendingUp, Info
} from "lucide-react";
import { ClientNav } from "@/components/dashboard/client-nav";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BicPenBanner } from "@/components/ui/editorial";

const TableHeader = ({ children }: { children?: React.ReactNode }) => (
  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left border-b border-neutral-100">
    {children}
  </th>
);

const Badge = ({ children, variant = "neutral" }: { children: React.ReactNode, variant?: string }) => {
  const styles: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    error: "bg-rose-50 text-rose-700 border-rose-100",
    brand: "bg-[#327039]/10 text-[#327039] border-[#327039]/20",
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-tight ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
};

export default function ClientOperacoes({ 
  initialData 
}: { 
  initialData: {
    coletas: any[],
    triagens: any[],
    estoque: any[],
    movimentacoes: any[],
    faturamentos: any[],
    modelos: any[]
  } 
}) {
  const [filters, setFilters] = useState({
    periodo: "30",
    status: "todos",
    modelo: "todos",
    busca: ""
  });

  const formatNumber = (val: number) => val.toLocaleString("pt-BR");
  const formatCurrency = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredColetas = useMemo(() => {
    return initialData.coletas.filter((c: any) => {
      const matchesSearch = (c.numero_lote || "").toLowerCase().includes(filters.busca.toLowerCase());
      const matchesStatus = filters.status === "todos" || c.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [initialData.coletas, filters]);

  const stats = useMemo(() => {
    const totalCargas = initialData.coletas.length;
    const totalColetado = initialData.coletas.reduce((acc: number, c: any) => acc + (c.quantidade_material_bruto || 0), 0);
    const totalTriado = initialData.triagens.reduce((acc: number, t: any) => acc + (t.quantidade_total || 0), 0);
    const totalEstoque = initialData.estoque.reduce((acc: number, e: any) => acc + (e.quantidade_disponivel || 0), 0);
    const totalEntregue = initialData.movimentacoes.filter((m: any) => m.tipo === "saida").reduce((acc: number, m: any) => acc + (m.quantidade || 0), 0);
    
    const allParcelas = initialData.faturamentos.flatMap((f: any) => f.parcelas || []);
    const hoje = new Date();
    const fatAberto = allParcelas.filter((p: any) => p.status === "para_vencer").length;
    const fatOk = allParcelas.filter((p: any) => p.status === "ok").length;

    return { totalCargas, totalColetado, totalTriado, totalEstoque, totalEntregue, fatAberto, fatOk };
  }, [initialData]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex justify-end mb-6">
          <ClientNav />
        </div>
        <BicPenBanner 
          title="Central de Operações PCE"
          subtitle="Acompanhamento detalhado das cargas, triagem, estoque e saídas em tempo real."
          image="/media__1778172190904.png"
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-10">
        
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard titulo="Total de Cargas" valor={stats.totalCargas} icone={Truck} cor="neutral" />
          <KpiCard titulo="Pallets Coletados" valor={formatNumber(stats.totalColetado)} icone={Package} cor="brand" />
          <KpiCard titulo="Saldo em Estoque" valor={formatNumber(stats.totalEstoque)} icone={Box} cor="success" />
          <KpiCard titulo="Entregas Realizadas" valor={formatNumber(stats.totalEntregue)} icone={RotateCw} cor="neutral" />
        </section>

        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por lote ou carga..."
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#327039]/20 transition-all"
              value={filters.busca}
              onChange={(e) => setFilters({...filters, busca: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:outline-none font-semibold text-neutral-600"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="todos">Todos os Status</option>
              <option value="coletada">Coletada</option>
              <option value="em_triagem">Em triagem</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center">
                <Truck size={20} className="text-neutral-600" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Status das Cargas</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50/50">
                  <TableHeader>Lote / Carga</TableHeader>
                  <TableHeader>Coleta</TableHeader>
                  <TableHeader>Quantidade</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Triagem</TableHeader>
                  <TableHeader>Atualização</TableHeader>
                  <TableHeader></TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredColetas.map((c: any) => {
                  const triagem = initialData.triagens.find((t: any) => t.coleta_id === c.id);
                  const triado = triagem?.quantidade_total || 0;
                  
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-neutral-900">{c.numero_lote || "S/N"}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-medium text-neutral-500">{new Date(c.data_coleta).toLocaleDateString("pt-BR")}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-neutral-900">{formatNumber(c.quantidade_material_bruto)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={c.status === 'finalizada' ? 'success' : c.status === 'em_triagem' ? 'brand' : 'neutral'}>
                          {c.status || "Pendente"}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Triado: {formatNumber(triado)}</span>
                          <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#327039]" 
                              style={{ width: `${Math.min(100, (triado / (c.quantidade_material_bruto || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs text-neutral-400 font-medium">{new Date(c.updated_at || c.created_at).toLocaleDateString("pt-BR")}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                          <Eye size={16} className="text-neutral-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredColetas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Activity size={40} className="text-neutral-200 mb-4" />
                        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Nenhuma operação encontrada</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center">
              <BarChart3 size={20} className="text-neutral-600" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Resultado Individual da Triagem</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialData.triagens.slice(0, 6).map((t: any) => {
              const sucata = (t.quantidade_total || 0) - ((t.quantidade_manutencao || 0) + (t.quantidade_remanufatura || 0) + (t.quantidade_compra_ivani || 0));
              const taxa = t.quantidade_total > 0 ? (((t.quantidade_total - sucata) / t.quantidade_total) * 100).toFixed(1) : 0;
              
              return (
                <div key={t.id} className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-bold text-neutral-900">{t.modelo?.nome || "Modelo Padrão"}</h4>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Lote: {t.coleta_id?.substring(0,8)}</p>
                    </div>
                    <Badge variant="success">{taxa}% Ref.</Badge>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {[
                      { label: "Reforma", value: t.quantidade_manutencao, color: "text-emerald-600" },
                      { label: "Remanufatura", value: t.quantidade_remanufatura, color: "text-[#327039]" },
                      { label: "Compra Ivani", value: t.quantidade_compra_ivani, color: "text-amber-600" },
                      { label: "Sucata", value: Math.max(0, sucata), color: "text-rose-500" }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-medium">{item.label}</span>
                        <span className={`font-bold ${item.color}`}>{item.value} un</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Triado</span>
                    <span className="text-lg font-bold text-neutral-900">{t.quantidade_total} un</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-neutral-100">
              <h3 className="text-xl font-bold tracking-tight">Saldo em Estoque</h3>
            </div>
            <div className="p-6 space-y-4">
              {initialData.estoque.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm">
                      <Box size={18} className="text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{e.modelo?.nome || e.modelo_nome_snapshot}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Disponível para entrega</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-emerald-600">{formatNumber(e.quantidade_disponivel)}</span>
                </div>
              ))}
              {initialData.estoque.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-10">Nenhum item em estoque.</p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Últimas Saídas</h3>
              <RotateCw size={18} className="text-neutral-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50/50">
                    <TableHeader>Data</TableHeader>
                    <TableHeader>Modelo</TableHeader>
                    <TableHeader>Quantidade</TableHeader>
                    <TableHeader>Destino</TableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {initialData.movimentacoes.filter((m: any) => m.tipo === 'saida').slice(0, 5).map((m: any) => (
                    <tr key={m.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4 text-xs text-neutral-500 font-medium">{new Date(m.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="px-6 py-4 text-sm font-bold text-neutral-900">{m.modelo?.nome || "Modelo Padrão"}</td>
                      <td className="px-6 py-4 text-sm font-black text-[#327039]">{m.quantidade} un</td>
                      <td className="px-6 py-4">
                        <Badge variant="neutral">Expedição</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center">
                <Banknote size={20} className="text-neutral-600" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Faturamento Operacional</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50/50">
                  <TableHeader>Lote / Modelo</TableHeader>
                  <TableHeader>Valor Total</TableHeader>
                  <TableHeader>Parcela 1 (30d)</TableHeader>
                  <TableHeader>Status</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {initialData.faturamentos.slice(0, 5).map((f: any) => {
                  const p1 = f.parcelas?.[0];
                  return (
                    <tr key={f.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-neutral-900">{f.modelo?.nome || "Faturamento"}</span>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">ID: {f.id.substring(0,8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-black text-neutral-900">{formatCurrency(f.valor_total_estimado || 0)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-neutral-700">{p1 ? new Date(p1.data_vencimento).toLocaleDateString("pt-BR") : "---"}</span>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={p1?.status === 'ok' ? 'success' : 'warning'}>{p1?.status === 'ok' ? 'Pago' : 'Aberto'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
