"use client";

import React, { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  Edit3, 
  AlertCircle,
  Loader2,
  X,
  Save,
  Trash2,
  ArrowLeft,
  LogOut,
  ChevronRight,
  User,
  Hash,
  Activity,
  CheckCircle2,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";

// --- TIPAGEM ---

interface Triagem {
  id: string;
  cliente_id: string;
  coleta_id: string;
  nf_saida_pce: string;
  motorista: string;
  caminhao: string;
  data_coleta: string;
  quantidade_total: number;
  quantidade_manutencao: number;
  quantidade_remanufatura: number;
  quantidade_descarte: number;
  quantidade_compra: number;
  status: string;
  observacao: string;
  created_at: string;
}

const supabase = createClient();

export default function AdminTriagemPage() {
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTriagem, setEditingTriagem] = useState<Triagem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTriagens = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("triagens")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setTriagens(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar triagens:", err);
      setError("Falha ao carregar triagens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriagens();
  }, []);

  const handleUpdateTriagem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTriagem) return;

    const formData = new FormData(e.currentTarget);
    const manutencao = parseInt(formData.get("quantidade_manutencao") as string || "0");
    const remanufatura = parseInt(formData.get("quantidade_remanufatura") as string || "0");
    const descarte = parseInt(formData.get("quantidade_descarte") as string || "0");
    const compra = parseInt(formData.get("quantidade_compra") as string || "0");
    
    const somaTotal = manutencao + remanufatura + descarte + compra;

    if (somaTotal > editingTriagem.quantidade_total) {
      alert(`A soma das quantidades (${somaTotal}) não pode ultrapassar a quantidade total recebida (${editingTriagem.quantidade_total}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      const { error: updateError } = await supabase
        .from("triagens")
        .update({
          quantidade_manutencao: manutencao,
          quantidade_remanufatura: remanufatura,
          quantidade_descarte: descarte,
          quantidade_compra: compra,
          observacao: formData.get("observacao") as string,
          status: somaTotal === editingTriagem.quantidade_total ? "finalizado" : "em_triagem"
        })
        .eq("id", editingTriagem.id);

      if (updateError) throw updateError;

      setIsModalOpen(false);
      setEditingTriagem(null);
      fetchTriagens();
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    } finally {
      setIsSubmitting(false);
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
                  <ClipboardList className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Triagem de Material</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin</span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1 ml-6">
                <Link href="/admin/lotes" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Lotes</Link>
                <Link href="/admin/coleta" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Coletas</Link>
                <Link href="/admin/triagem" className="px-4 py-2 bg-brand-cyan/5 text-brand-cyan rounded-lg text-xs font-bold">Triagem</Link>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Módulo de Triagem</h1>
          <p className="text-text-dark/50 text-sm mt-1">Classifique os materiais recebidos e defina o destino de cada pallet.</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-cyan" size={32} />
            <p className="text-xs font-bold text-text-dark/30 uppercase tracking-widest">Carregando triagens...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
            <p className="text-sm font-medium text-text-dark/50">{error}</p>
          </div>
        ) : triagens.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-3xl border border-brand-pink/20">
            <ClipboardList className="mx-auto text-text-dark/10 mb-4" size={64} />
            <h3 className="text-lg font-bold text-text-dark/60">Aguardando materiais</h3>
            <p className="text-sm text-text-dark/40 max-w-xs mx-auto mt-2">Envie registros da aba Coletas para iniciar o processamento aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {triagens.map((item) => (
              <motion.div 
                key={item.id}
                layout
                className="bg-white rounded-3xl border border-brand-pink/20 p-6 card-shadow hover:border-brand-cyan/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-cyan/5 rounded-xl flex items-center justify-center text-brand-cyan">
                      <Activity size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Status</span>
                      <div className={`text-[10px] font-bold uppercase ${item.status === 'finalizado' ? 'text-green-500' : 'text-brand-cyan'}`}>
                        {item.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setEditingTriagem(item); setIsModalOpen(true); }}
                    className="p-2 text-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/10 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Edit3 size={14} /> Processar
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Total Recebido</span>
                      <div className="text-2xl font-black text-text-dark">{item.quantidade_total} <span className="text-xs font-bold text-text-dark/20 uppercase tracking-tighter">un</span></div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Origem (Coleta)</span>
                      <div className="text-[11px] font-bold text-text-dark/60">{new Date(item.data_coleta).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-brand-pink/10">
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter block mb-1">Manutenção</span>
                      <div className="text-lg font-bold text-text-dark">{item.quantidade_manutencao}</div>
                    </div>
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-purple-600 uppercase tracking-tighter block mb-1">Remanufatura</span>
                      <div className="text-lg font-bold text-text-dark">{item.quantidade_remanufatura}</div>
                    </div>
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter block mb-1">Compra Ivani</span>
                      <div className="text-lg font-bold text-text-dark">{item.quantidade_compra}</div>
                    </div>
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter block mb-1">Descarte</span>
                      <div className="text-lg font-bold text-text-dark">{item.quantidade_descarte}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-dark/30 font-medium">
                    <div className="flex items-center gap-1.5"><Hash size={12} /> {item.nf_saida_pce || "S/NF"}</div>
                    <div className="flex items-center gap-1.5"><User size={12} /> {item.motorista || "S/MOT"}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && editingTriagem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan"><Activity size={20} /></div>
                  <h3 className="font-bold text-lg">Processar Triagem</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dark/30 hover:text-text-dark"><X size={20} /></button>
              </div>

              <form onSubmit={handleUpdateTriagem} className="p-8 space-y-6">
                <div className="bg-brand-cyan/5 p-4 rounded-2xl border border-brand-cyan/10 flex justify-between items-center">
                   <div className="text-xs font-bold text-brand-cyan uppercase tracking-widest">Capacidade Máxima do Lote</div>
                   <div className="text-2xl font-black text-brand-cyan">{editingTriagem.quantidade_total}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600 ml-1">Manutenção</label>
                    <input name="quantidade_manutencao" type="number" min="0" defaultValue={editingTriagem.quantidade_manutencao} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-purple-600 ml-1">Remanufatura</label>
                    <input name="quantidade_remanufatura" type="number" min="0" defaultValue={editingTriagem.quantidade_remanufatura} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-green-600 ml-1">Compra Ivani</label>
                    <input name="quantidade_compra" type="number" min="0" defaultValue={editingTriagem.quantidade_compra} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">Descarte</label>
                    <input name="quantidade_descarte" type="number" min="0" defaultValue={editingTriagem.quantidade_descarte} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Observações da Triagem</label>
                  <textarea name="observacao" defaultValue={editingTriagem.observacao} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none min-h-[80px] resize-none" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-text-dark/60">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg hover:bg-[#1a6e74] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Finalizar Etapa
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
