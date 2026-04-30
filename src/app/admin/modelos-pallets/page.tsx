"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Loader2,
  X,
  Save,
  Trash2,
  ArrowLeft,
  LogOut,
  Box,
  Hash,
  DollarSign,
  Maximize2,
  AlertCircle,
  Activity,
  CheckCircle2,
  ClipboardList,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";

// --- TIPAGEM ---

interface ModeloPallet {
  id: string;
  cliente_id: string;
  codigo: string;
  nome: string;
  medidas: string;
  preco_reforma: number;
  preco_remanufatura: number;
  preco_compra_ivani: number;
  preco_pallet_novo: number;
  ativo: boolean;
  observacao: string;
}

const supabase = createClient();

export default function AdminModelosPalletsPage() {
  const [modelos, setModelos] = useState<ModeloPallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloPallet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchModelos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("modelos_pallets")
        .select("*")
        .order("nome", { ascending: true });

      if (fetchError) throw fetchError;
      setModelos(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar modelos:", err);
      setError("Falha ao carregar modelos de pallets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelos();
  }, []);

  const filteredModelos = modelos.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const modeloData = {
      nome: formData.get("nome") as string,
      codigo: formData.get("codigo") as string,
      medidas: formData.get("medidas") as string,
      preco_reforma: parseFloat(formData.get("preco_reforma") as string || "0"),
      preco_remanufatura: parseFloat(formData.get("preco_remanufatura") as string || "0"),
      preco_compra_ivani: parseFloat(formData.get("preco_compra_ivani") as string || "0"),
      preco_pallet_novo: parseFloat(formData.get("preco_pallet_novo") as string || "0"),
      observacao: formData.get("observacao") as string,
      cliente_id: 'pce'
    };

    try {
      setIsSubmitting(true);
      if (editingModelo) {
        const { error: updateError } = await supabase
          .from("modelos_pallets")
          .update(modeloData)
          .eq("id", editingModelo.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("modelos_pallets")
          .insert([modeloData]);
        if (insertError) throw insertError;
      }

      setIsModalOpen(false);
      setEditingModelo(null);
      fetchModelos();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (modelo: ModeloPallet) => {
    try {
      const { error: updateError } = await supabase
        .from("modelos_pallets")
        .update({ ativo: !modelo.ativo })
        .eq("id", modelo.id);
      if (updateError) throw updateError;
      fetchModelos();
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button onClick={() => window.location.href = "/"} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={18} className="text-text-dark/40" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center">
                  <Box className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Modelos & Preços</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin</span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1 ml-6">
                <Link href="/admin/lotes" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Lotes</Link>
                <Link href="/admin/coleta" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Coletas</Link>
                <Link href="/admin/triagem" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Triagem</Link>
                <Link href="/admin/modelos-pallets" className="px-4 py-2 bg-brand-cyan/5 text-brand-cyan rounded-lg text-xs font-bold">Modelos</Link>
                <Link href="/admin/relatorios" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Relatórios</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => logout()} className="p-2 text-text-dark/40 hover:text-red-500 transition-colors" title="Sair"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catálogo de Produtos (PCE)</h1>
            <p className="text-text-dark/50 text-sm mt-1">Configuração de medidas e precificação para faturamento futuro.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/30" size={16} />
              <input 
                type="text" 
                placeholder="Buscar modelo ou código..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-brand-pink/20 rounded-xl text-xs font-medium w-full md:w-64 outline-none focus:ring-2 focus:ring-brand-cyan/10 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setEditingModelo(null); setIsModalOpen(true); }}
              className="px-5 py-2.5 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} /> Novo Modelo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-cyan" size={32} />
            <p className="text-[10px] font-black text-text-dark/20 uppercase tracking-widest">Carregando catálogo...</p>
          </div>
        ) : filteredModelos.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-brand-pink/20 shadow-sm">
            <Box className="mx-auto text-text-dark/10 mb-4" size={48} />
            <p className="text-text-dark/50 text-sm font-medium">Nenhum modelo encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModelos.map((item) => (
              <motion.div 
                key={item.id}
                layout
                className={`bg-white rounded-3xl border ${item.ativo ? 'border-brand-pink/20' : 'border-gray-200 opacity-60'} p-6 card-shadow hover:border-brand-cyan/30 transition-all group relative overflow-hidden`}
              >
                {!item.ativo && <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-100 text-[8px] font-black uppercase text-gray-400 rounded-full">Inativo</div>}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.ativo ? 'bg-brand-cyan/5 text-brand-cyan' : 'bg-gray-50 text-gray-400'} rounded-xl flex items-center justify-center`}>
                      <Box size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">{item.codigo || "S/ COD"}</span>
                      <h3 className="text-sm font-bold text-text-dark leading-tight">{item.nome}</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setEditingModelo(item); setIsModalOpen(true); }}
                    className="p-2 text-text-dark/20 hover:text-brand-cyan transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-text-dark/50">
                    <Maximize2 size={14} />
                    <span className="text-xs font-bold">{item.medidas || "Medidas não informadas"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-brand-pink/10">
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-text-dark/40 uppercase tracking-tighter block mb-1">Reforma</span>
                      <div className="text-sm font-black text-text-dark">R$ {item.preco_reforma.toFixed(2)}</div>
                    </div>
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-text-dark/40 uppercase tracking-tighter block mb-1">Remanufat.</span>
                      <div className="text-sm font-black text-text-dark">R$ {item.preco_remanufatura.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
                      <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter block mb-1">Compra Ivani</span>
                      <div className="text-sm font-black text-green-700">R$ {item.preco_compra_ivani.toFixed(2)}</div>
                    </div>
                    <div className="bg-brand-cyan/5 p-3 rounded-2xl border border-brand-cyan/10">
                      <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-tighter block mb-1">Preço Novo</span>
                      <div className="text-sm font-black text-brand-cyan">R$ {item.preco_pallet_novo.toFixed(2)}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleStatus(item)}
                    className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${item.ativo ? 'border-red-100 text-red-400 hover:bg-red-50' : 'border-green-100 text-green-500 hover:bg-green-50'}`}
                  >
                    {item.ativo ? "Desativar Modelo" : "Ativar Modelo"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan"><Box size={20} /></div>
                  <h3 className="font-bold text-lg">{editingModelo ? "Editar Modelo" : "Novo Modelo de Pallet"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Nome do Modelo</label>
                    <input name="nome" defaultValue={editingModelo?.nome} required className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20" placeholder="Ex: PBR 1 Madeira" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Código Interno</label>
                    <input name="codigo" defaultValue={editingModelo?.codigo} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20" placeholder="Ex: PBR1" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Medidas (mm)</label>
                  <input name="medidas" defaultValue={editingModelo?.medidas} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20" placeholder="Ex: 1000 x 1200" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Preço Reforma</label>
                    <input name="preco_reforma" type="number" step="0.01" defaultValue={editingModelo?.preco_reforma} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Preço Remanuf.</label>
                    <input name="preco_remanufatura" type="number" step="0.01" defaultValue={editingModelo?.preco_remanufatura} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Preço Compra</label>
                    <input name="preco_compra_ivani" type="number" step="0.01" defaultValue={editingModelo?.preco_compra_ivani} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Preço Novo</label>
                    <input name="preco_pallet_novo" type="number" step="0.01" defaultValue={editingModelo?.preco_pallet_novo} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Observações</label>
                  <textarea name="observacao" defaultValue={editingModelo?.observacao} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none min-h-[80px] resize-none focus:ring-2 focus:ring-brand-cyan/20" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-text-dark/60 hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg hover:bg-[#1a6e74] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Modelo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
