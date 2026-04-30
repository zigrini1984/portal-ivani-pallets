"use client";

import React, { useState, useEffect } from "react";
import { 
  Truck, 
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
  ClipboardList,
  User,
  Hash,
  History,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";

// --- TIPAGEM ---

interface Coleta {
  id: string;
  cliente_id: string;
  nf_saida_pce: string;
  motorista: string;
  caminhao: string;
  data_coleta: string;
  quantidade_material_bruto: number;
  observacao: string;
  status: string;
  enviado_triagem: boolean;
  data_envio_triagem: string | null;
  created_at: string;
}

const supabase = createClient();

export default function AdminColetaPage() {
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColeta, setEditingColeta] = useState<Coleta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferringId, setTransferringId] = useState<string | null>(null);

  const fetchColetas = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("coletas")
        .select("*")
        .order("data_coleta", { ascending: false });

      if (fetchError) throw fetchError;
      setColetas(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar coletas:", err);
      setError("Falha ao carregar coletas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColetas();
  }, []);

  const handleSaveColeta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const coletaData = {
      nf_saida_pce: formData.get("nf_saida_pce") as string,
      motorista: formData.get("motorista") as string,
      caminhao: formData.get("caminhao") as string,
      data_coleta: formData.get("data_coleta") as string,
      quantidade_material_bruto: parseInt(formData.get("quantidade_material_bruto") as string || "0"),
      observacao: formData.get("observacao") as string,
      cliente_id: "pce"
    };

    if (coletaData.quantidade_material_bruto <= 0) {
      alert("A quantidade deve ser um número positivo.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingColeta) {
        const { error: updateError } = await supabase
          .from("coletas")
          .update(coletaData)
          .eq("id", editingColeta.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("coletas")
          .insert(coletaData);

        if (insertError) throw insertError;
      }

      setIsModalOpen(false);
      setEditingColeta(null);
      fetchColetas();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToTriagem = async (coleta: Coleta) => {
    if (coleta.enviado_triagem) return;
    
    if (!confirm(`Deseja enviar a coleta do dia ${new Date(coleta.data_coleta).toLocaleDateString('pt-BR')} para triagem?`)) {
      return;
    }

    try {
      setTransferringId(coleta.id);

      // 1. Verificar se já existe em triagens para evitar duplicação
      const { data: existingTriagem } = await supabase
        .from("triagens")
        .select("id")
        .eq("coleta_id", coleta.id)
        .single();

      if (existingTriagem) {
        alert("Esta coleta já foi enviada para triagem anteriormente.");
        // Sincronizar status local se necessário
        await supabase.from("coletas").update({ enviado_triagem: true }).eq("id", coleta.id);
        fetchColetas();
        return;
      }

      // 2. Criar registro em Triagens
      const { error: insertError } = await supabase
        .from("triagens")
        .insert({
          coleta_id: coleta.id,
          cliente_id: "pce",
          nf_saida_pce: coleta.nf_saida_pce,
          motorista: coleta.motorista,
          caminhao: coleta.caminhao,
          data_coleta: coleta.data_coleta,
          quantidade_total: coleta.quantidade_material_bruto,
          status: "em_triagem"
        });

      if (insertError) throw insertError;

      // 3. Atualizar status na tabela Coletas
      const { error: updateError } = await supabase
        .from("coletas")
        .update({
          enviado_triagem: true,
          status: "em_triagem",
          data_envio_triagem: new Date().toISOString()
        })
        .eq("id", coleta.id);

      if (updateError) throw updateError;

      fetchColetas();
    } catch (err: any) {
      alert("Erro ao transferir para triagem: " + err.message);
    } finally {
      setTransferringId(null);
    }
  };

  const handleDeleteColeta = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta coleta?")) return;
    try {
      const { error: deleteError } = await supabase
        .from("coletas")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      fetchColetas();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleOpenEdit = (coleta: Coleta) => {
    setEditingColeta(coleta);
    setIsModalOpen(true);
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
                  <Truck className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Gestão de Coletas</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin</span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1 ml-6">
                <Link href="/admin/lotes" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Lotes</Link>
                <Link href="/admin/coleta" className="px-4 py-2 bg-brand-cyan/5 text-brand-cyan rounded-lg text-xs font-bold">Coletas</Link>
                <Link href="/admin/triagem" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Triagem</Link>
                <Link href="/admin/relatorios" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Relatórios</Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
               <button 
                onClick={() => { setEditingColeta(null); setIsModalOpen(true); }}
                className="px-4 py-2 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all flex items-center gap-2"
               >
                 <Plus size={16} /> Nova Coleta
               </button>
               <button onClick={() => logout()} className="p-2 text-text-dark/40 hover:text-red-500 transition-colors" title="Sair"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Coletas PCE Logística</h1>
            <p className="text-text-dark/50 text-sm mt-1">Registro e transferência de material para a etapa de triagem.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-cyan" size={32} />
            <p className="text-xs font-bold text-text-dark/30 uppercase tracking-widest">Buscando coletas...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
            <p className="text-sm font-medium text-text-dark/50">{error}</p>
          </div>
        ) : coletas.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-3xl border border-brand-pink/20">
            <Truck className="mx-auto text-text-dark/10 mb-4" size={64} />
            <h3 className="text-lg font-bold text-text-dark/60">Nenhuma coleta registrada</h3>
            <button onClick={() => { setEditingColeta(null); setIsModalOpen(true); }} className="mt-6 px-6 py-3 bg-brand-cyan/10 text-brand-cyan rounded-xl font-bold text-xs hover:bg-brand-cyan/20 transition-all">Registrar Primeira Coleta</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {coletas.map((coleta) => (
                <motion.div 
                  key={coleta.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl border border-brand-pink/20 p-6 card-shadow hover:border-brand-cyan/30 transition-all group relative overflow-hidden"
                >
                  {coleta.enviado_triagem && (
                    <div className="absolute top-0 right-0 p-3">
                      <div className="bg-brand-cyan/10 text-brand-cyan px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border border-brand-cyan/20 flex items-center gap-1.5">
                        <CheckCircle2 size={12} />
                        Em Triagem
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${coleta.enviado_triagem ? 'bg-brand-cyan/5 text-brand-cyan' : 'bg-bg-primary text-brand-cyan group-hover:bg-brand-cyan/5'}`}>
                      <Truck size={24} />
                    </div>
                    {!coleta.enviado_triagem && (
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(coleta)} className="p-2 text-text-dark/30 hover:text-brand-cyan hover:bg-brand-cyan/5 rounded-lg transition-all"><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteColeta(coleta.id)} className="p-2 text-text-dark/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Data da Coleta</span>
                        <div className="flex items-center gap-2 text-text-dark font-bold">
                          <Calendar size={14} className="text-brand-cyan" />
                          {new Date(coleta.data_coleta).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Qtd Material</span>
                        <div className="text-xl font-bold text-brand-cyan leading-none">{coleta.quantidade_material_bruto} <span className="text-[10px] uppercase font-bold text-text-dark/30">un</span></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-brand-pink/10 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-text-dark/20" />
                        <span className="text-[11px] font-semibold text-text-dark/60 truncate">{coleta.nf_saida_pce || "Sem NF"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-text-dark/20" />
                        <span className="text-[11px] font-semibold text-text-dark/60 truncate">{coleta.motorista || "Não informado"}</span>
                      </div>
                    </div>

                    {!coleta.enviado_triagem ? (
                      <button 
                        onClick={() => handleSendToTriagem(coleta)}
                        disabled={transferringId === coleta.id}
                        className="w-full mt-4 py-3 bg-brand-cyan text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-cyan/10 hover:bg-[#1a6e74] transition-all flex items-center justify-center gap-2"
                      >
                        {transferringId === coleta.id ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
                        Enviar para Triagem
                      </button>
                    ) : (
                      <div className="w-full mt-4 py-3 bg-gray-50 border border-gray-100 text-text-dark/30 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <History size={14} />
                        Enviado em {new Date(coleta.data_envio_triagem!).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan"><Truck size={20} /></div>
                  <h3 className="font-bold text-lg">{editingColeta ? "Editar Registro" : "Nova Coleta"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveColeta} className="p-8 space-y-5 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Data da Coleta *</label>
                    <input name="data_coleta" type="date" defaultValue={editingColeta?.data_coleta} required className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Material Bruto (Qtd) *</label>
                    <input name="quantidade_material_bruto" type="number" min="1" defaultValue={editingColeta?.quantidade_material_bruto} required placeholder="Ex: 450" className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">NF Saída PCE</label>
                  <input name="nf_saida_pce" defaultValue={editingColeta?.nf_saida_pce} placeholder="Número da nota fiscal" className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Motorista</label>
                    <input name="motorista" defaultValue={editingColeta?.motorista} placeholder="Nome do motorista" className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Caminhão (Placa)</label>
                    <input name="caminhao" defaultValue={editingColeta?.caminhao} placeholder="ABC-1234" className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none uppercase" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Observação</label>
                  <textarea name="observacao" defaultValue={editingColeta?.observacao} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan outline-none min-h-[100px] resize-none" placeholder="Informações adicionais..." />
                </div>
                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all text-text-dark/60">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {editingColeta ? "Salvar Alterações" : "Registrar Coleta"}
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
