"use client";

import React, { useState } from "react";
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
  CircleDot
} from "lucide-react";
import { motion } from "framer-motion";

// Dados mockados para visualização imediata
const MOCK_STATS = [
  { label: "Recebidos", value: 1250, icon: <Package className="text-brand-cyan" />, color: "bg-brand-cyan/10" },
  { label: "Em Triagem", value: 450, icon: <ClipboardCheck className="text-brand-yellow" />, color: "bg-brand-yellow/10" },
  { label: "Manutenção", value: 380, icon: <Hammer className="text-brand-brown" />, color: "bg-brand-brown/10" },
  { label: "Descartados", value: 120, icon: <Trash2 className="text-red-500" />, color: "bg-red-50" },
  { label: "Comprados", value: 210, icon: <DollarSign className="text-green-500" />, color: "bg-green-50" },
  { label: "Finalizados", value: 890, icon: <CheckCircle2 className="text-brand-cyan" />, color: "bg-brand-cyan/10" },
];

const MOCK_LOTES = [
  { id: "LOTE-2024-001", data: "2024-04-25", qtd: 250, status: "Em Manutenção", destino: "Reforma", obs: "Pallets PBR1", atualizado: "Há 2 horas" },
  { id: "LOTE-2024-002", data: "2024-04-26", qtd: 400, status: "Triagem", destino: "A definir", obs: "Material misto", atualizado: "Há 5 horas" },
  { id: "LOTE-2024-003", data: "2024-04-28", qtd: 150, status: "Finalizado", destino: "Compra Ivani", obs: "Qualidade A", atualizado: "Ontem" },
  { id: "LOTE-2024-004", data: "2024-04-29", qtd: 320, status: "Aguardando Coleta", destino: "A definir", obs: "Unidade Industrial", atualizado: "Hoje" },
];

const PROCESS_STEPS = [
  { id: 1, label: "Coleta Solicitada", status: "complete", date: "25/04 - 10:30" },
  { id: 2, label: "Coleta Realizada", status: "complete", date: "25/04 - 15:45" },
  { id: 3, label: "Material Recebido", status: "complete", date: "26/04 - 08:20" },
  { id: 4, label: "Em Triagem", status: "active", date: "Em curso" },
  { id: 5, label: "Manutenção / Destino", status: "pending", date: "-" },
  { id: 6, label: "Finalizado", status: "pending", date: "-" },
];

export default function ClienteDashboard() {
  const [activeTab, setActiveTab] = useState("resumo");

  return (
    <div className="min-h-screen bg-bg-primary text-text-dark font-sans pb-20">
      {/* Header / Navbar */}
      <nav className="bg-white border-b border-brand-pink/50 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-cyan rounded-xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
              <Package className="text-white" size={20} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-brand-cyan">Portal Ivani Pallets</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-text-dark/60 bg-brand-pink/20 px-4 py-2 rounded-full border border-brand-pink/50">
              <CircleDot className="text-brand-cyan" size={14} />
              <span>Logado como: <strong>TCE Logística</strong></span>
            </div>
            <button className="p-2 text-text-dark/40 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        {/* Título e Ações Rápidas */}
        <div className="flex flex-col md:row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel de Acompanhamento</h1>
            <p className="text-text-dark/50">Veja o status real de cada pallet enviado para nossa central.</p>
          </div>
          <button className="bg-brand-cyan hover:bg-[#1a6e74] text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-brand-cyan/20">
            <Truck size={20} />
            Solicitar Nova Coleta
          </button>
        </div>

        {/* Grid de Resumo Operacional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-16">
          {MOCK_STATS.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="bg-white p-6 rounded-3xl card-shadow border border-brand-pink/20 hover:border-brand-cyan/30 transition-all group"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value.toLocaleString()}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-text-dark/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Tabela de Lotes (Coluna Larga) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] card-shadow border border-brand-pink/20 overflow-hidden">
              <div className="p-8 border-b border-brand-pink/20 flex justify-between items-center bg-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Clock className="text-brand-cyan" size={20} />
                  Lotes em Andamento
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/30" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar lote..." 
                      className="pl-10 pr-4 py-2 bg-bg-primary border border-brand-pink/30 rounded-xl text-sm focus:outline-none focus:border-brand-cyan/50"
                    />
                  </div>
                  <button className="p-2 bg-bg-primary border border-brand-pink/30 rounded-xl text-text-dark/50 hover:text-brand-cyan transition-colors">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40">
                      <th className="px-8 py-4">Lote / Data</th>
                      <th className="px-6 py-4">Quantidade</th>
                      <th className="px-6 py-4">Status Atual</th>
                      <th className="px-6 py-4">Destino</th>
                      <th className="px-8 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-pink/10">
                    {MOCK_LOTES.map((lote, i) => (
                      <tr key={i} className="hover:bg-brand-pink/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-bold text-sm mb-1">{lote.id}</div>
                          <div className="text-xs text-text-dark/40">{new Date(lote.data).toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="font-bold text-brand-cyan">{lote.qtd}</span>
                          <span className="text-xs text-text-dark/40 ml-1">unid.</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${lote.status === 'Finalizado' ? 'bg-green-500' : 'bg-brand-yellow'} animate-pulse`} />
                            <span className="text-sm font-medium">{lote.status}</span>
                          </div>
                          <div className="text-[10px] text-text-dark/30 italic mt-1">Atu: {lote.atualizado}</div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            lote.destino === 'A definir' ? 'bg-bg-primary text-text-dark/40 border border-brand-pink/50' : 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
                          }`}>
                            {lote.destino}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 text-text-dark/20 group-hover:text-brand-cyan transition-all">
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-bg-primary/30 border-t border-brand-pink/20 text-center">
                <button className="text-sm font-bold text-brand-cyan hover:underline flex items-center gap-2 mx-auto">
                  Ver todo o histórico de lotes
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline do Lote em Destaque (Coluna Estreita) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] card-shadow border border-brand-pink/20 p-8 h-full">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <CircleDot className="text-brand-cyan" size={20} />
                Status do Lote Ativo
              </h2>
              
              <div className="mb-8 p-4 bg-brand-cyan/5 rounded-2xl border border-brand-cyan/10">
                <div className="text-xs font-bold text-brand-cyan uppercase tracking-widest mb-1">Acompanhando agora:</div>
                <div className="text-lg font-bold">LOTE-2024-002</div>
                <div className="text-xs text-text-dark/40">Iniciado em 26 de Abril de 2024</div>
              </div>

              <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-pink/30">
                {PROCESS_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-6 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.status === 'complete' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 
                      step.status === 'active' ? 'bg-brand-yellow text-white shadow-lg shadow-brand-yellow/30 scale-125' : 
                      'bg-bg-primary border-2 border-brand-pink/30'
                    }`}>
                      {step.status === 'complete' && <CheckCircle2 size={14} />}
                      {step.status === 'active' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${step.status === 'pending' ? 'text-text-dark/30' : 'text-text-dark'}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-text-dark/40 font-medium">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-brand-pink/20">
                <p className="text-xs text-text-dark/50 leading-relaxed italic">
                  * Este material está passando pela triagem criteriosa da nossa equipe técnica para definir o melhor reaproveitamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Simples */}
      <footer className="mt-20 pt-10 pb-10 border-t border-brand-pink/30 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Package className="text-brand-cyan/40" size={16} />
          <span className="text-xs font-bold tracking-widest uppercase text-text-dark/30">© 2024 Ivani Pallets — Portal do Cliente</span>
        </div>
      </footer>
    </div>
  );
}
