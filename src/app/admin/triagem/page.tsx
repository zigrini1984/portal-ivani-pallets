"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, 
  Calendar, 
  Edit3, 
  AlertCircle,
  Loader2,
  X,
  Save,
  ArrowLeft,
  LogOut,
  Hash,
  Activity,
  CheckCircle2,
  DollarSign,
  Calculator,
  ArrowDownCircle,
  History,
  Lock,
  Eye
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
  quantidade_sucata: number;
  quantidade_manutencao: number;
  quantidade_remanufatura: number;
  quantidade_compra_ivani: number;
  valor_unitario_compra: number;
  valor_total_compra: number;
  status: 'em_triagem' | 'classificada' | 'finalizada';
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
  const [userId, setUserId] = useState<string | null>(null);

  // Estados locais do formulário para cálculos em tempo real
  const [formValues, setFormValues] = useState({
    quantidade_manutencao: 0,
    quantidade_remanufatura: 0,
    quantidade_compra_ivani: 0,
    valor_unitario_compra: 0,
    observacao: ""
  });

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
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);
    };
    getUser();
    fetchTriagens();
  }, []);

  // Monitorar mudanças no modal para resetar valores de cálculo
  useEffect(() => {
    if (editingTriagem) {
      setFormValues({
        quantidade_manutencao: editingTriagem.quantidade_manutencao || 0,
        quantidade_remanufatura: editingTriagem.quantidade_remanufatura || 0,
        quantidade_compra_ivani: editingTriagem.quantidade_compra_ivani || 0,
        valor_unitario_compra: editingTriagem.valor_unitario_compra || 0,
        observacao: editingTriagem.observacao || ""
      });
    }
  }, [editingTriagem]);

  // Cálculos automáticos
  const somaClassificada = useMemo(() => {
    return formValues.quantidade_manutencao + formValues.quantidade_remanufatura + formValues.quantidade_compra_ivani;
  }, [formValues]);

  const porcentagemClassificada = useMemo(() => {
    if (!editingTriagem || editingTriagem.quantidade_total === 0) return 0;
    return Math.min(100, (somaClassificada / editingTriagem.quantidade_total) * 100);
  }, [editingTriagem, somaClassificada]);

  const sucataCalculada = useMemo(() => {
    if (!editingTriagem) return 0;
    return editingTriagem.quantidade_total - somaClassificada;
  }, [editingTriagem, somaClassificada]);

  const valorTotalCompra = useMemo(() => {
    return formValues.quantidade_compra_ivani * formValues.valor_unitario_compra;
  }, [formValues.quantidade_compra_ivani, formValues.valor_unitario_compra]);

  const handleUpdateTriagem = async (finalizar: boolean = false) => {
    if (!editingTriagem) return;

    if (somaClassificada > editingTriagem.quantidade_total) {
      alert(`Erro: A soma classificada (${somaClassificada}) não pode ultrapassar a quantidade total coletada (${editingTriagem.quantidade_total}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const novosDados = {
        ...formValues,
        quantidade_sucata: sucataCalculada,
        valor_total_compra: valorTotalCompra,
        status: finalizar ? "finalizada" : "classificada"
      };

      // 1. Atualizar triagem
      const { error: updateError } = await supabase
        .from("triagens")
        .update(novosDados)
        .eq("id", editingTriagem.id);

      if (updateError) throw updateError;

      // 2. Registrar auditoria
      await supabase.from("triagem_auditoria").insert({
        triagem_id: editingTriagem.id,
        usuario_id: userId,
        acao: finalizar ? "finalizado" : "editado",
        dados_antes: editingTriagem,
        dados_depois: { ...editingTriagem, ...novosDados },
        observacao: finalizar ? "Triagem finalizada com trava de segurança" : "Edição de rascunho"
      });

      setIsModalOpen(false);
      setEditingTriagem(null);
      fetchTriagens();
    } catch (err: any) {
      alert("Erro ao processar: " + err.message);
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
                  <span className="font-bold text-sm leading-none text-brand-cyan">Processo de Triagem</span>
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
          <h1 className="text-2xl font-bold tracking-tight">Classificação de Materiais</h1>
          <p className="text-text-dark/50 text-sm mt-1">Gestão de carga triada com auditoria e travas de segurança.</p>
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
            <h3 className="text-lg font-bold text-text-dark/60 text-center">Aguardando Envio de Coletas</h3>
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
                      <div className={`text-[10px] font-bold uppercase ${item.status === 'finalizada' ? 'text-green-600' : 'text-brand-cyan'}`}>
                        {item.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setEditingTriagem(item); setIsModalOpen(true); }}
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${item.status === 'finalizada' ? 'text-text-dark/40 bg-gray-50' : 'text-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/10'}`}
                  >
                    {item.status === 'finalizada' ? <><Eye size={14} /> Visualizar</> : <><Edit3 size={14} /> Classificar</>}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Carga Coletada</span>
                      <div className="text-2xl font-black text-text-dark">{item.quantidade_total} <span className="text-xs font-bold text-text-dark/20">un</span></div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Origem</span>
                      <div className="text-[11px] font-bold text-text-dark/60">{new Date(item.data_coleta).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-brand-pink/10">
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-text-dark/40 uppercase tracking-tighter block mb-1">Manutenção</span>
                      <div className="text-base font-bold text-text-dark">{item.quantidade_manutencao}</div>
                    </div>
                    <div className="bg-bg-primary p-3 rounded-2xl">
                      <span className="text-[9px] font-bold text-text-dark/40 uppercase tracking-tighter block mb-1">Remanufatura</span>
                      <div className="text-base font-bold text-text-dark">{item.quantidade_remanufatura}</div>
                    </div>
                    <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100/50">
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter block mb-1">Sucata (Auto)</span>
                      <div className="text-base font-bold text-red-500">{item.quantidade_sucata}</div>
                    </div>
                    <div className="bg-brand-cyan/5 p-3 rounded-2xl border border-brand-cyan/10">
                      <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-tighter block mb-1">Compra Ivani</span>
                      <div className="text-base font-bold text-brand-cyan">{item.quantidade_compra_ivani}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-dark/30 font-medium pt-2">
                    <div className="flex items-center gap-1.5"><Hash size={12} /> {item.nf_saida_pce || "S/NF"}</div>
                    <div className="flex items-center gap-1.5"><History size={12} /> {new Date(item.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && editingTriagem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                    {editingTriagem.status === 'finalizada' ? <Lock size={20} /> : <Calculator size={20} />}
                  </div>
                  <h3 className="font-bold text-lg">{editingTriagem.status === 'finalizada' ? "Triagem Finalizada (Auditada)" : "Classificar Carga"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>

              <div className="px-8 pt-6 pb-2">
                 <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">Status de Processamento</span>
                       <span className="text-xs font-black text-brand-cyan">{porcentagemClassificada.toFixed(0)}% da carga classificada</span>
                    </div>
                    {sucataCalculada > 0 && (
                       <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1.5">
                          <AlertCircle size={12} /> Faltam {sucataCalculada} pallets
                       </span>
                    )}
                 </div>
                 <div className="w-full h-3 bg-bg-primary rounded-full overflow-hidden border border-brand-pink/10 shadow-inner p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${porcentagemClassificada}%` }}
                      className={`h-full rounded-full ${sucataCalculada < 0 ? 'bg-red-500' : 'bg-brand-cyan'} transition-all shadow-sm`}
                    />
                 </div>
              </div>

              <div className="p-8 space-y-6 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-primary p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                     <span className="text-[10px] font-bold text-text-dark/40 uppercase block mb-1 tracking-widest">Total Coletado</span>
                     <div className="text-3xl font-black text-text-dark">{editingTriagem.quantidade_total}</div>
                  </div>
                  <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center ${sucataCalculada < 0 ? 'bg-red-50 border-red-200' : 'bg-red-50/50 border-red-100'}`}>
                     <span className={`text-[10px] font-bold uppercase block mb-1 tracking-widest ${sucataCalculada < 0 ? 'text-red-500' : 'text-red-400'}`}>Sucata Automática</span>
                     <div className={`text-3xl font-black ${sucataCalculada < 0 ? 'text-red-600' : 'text-red-500'}`}>
                        {sucataCalculada < 0 ? "Erro!" : sucataCalculada}
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 p-4 bg-bg-primary/50 rounded-2xl border border-brand-pink/5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/60 ml-1">Manutenção</label>
                    <input disabled={editingTriagem.status === 'finalizada'} type="number" min="0" value={formValues.quantidade_manutencao} onChange={(e) => setFormValues(prev => ({ ...prev, quantidade_manutencao: parseInt(e.target.value || "0") }))} className="w-full px-4 py-3 bg-white border border-brand-pink/20 rounded-xl text-sm font-bold outline-none disabled:opacity-50" />
                  </div>
                  <div className="space-y-1.5 p-4 bg-bg-primary/50 rounded-2xl border border-brand-pink/5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/60 ml-1">Remanufatura</label>
                    <input disabled={editingTriagem.status === 'finalizada'} type="number" min="0" value={formValues.quantidade_remanufatura} onChange={(e) => setFormValues(prev => ({ ...prev, quantidade_remanufatura: parseInt(e.target.value || "0") }))} className="w-full px-4 py-3 bg-white border border-brand-pink/20 rounded-xl text-sm font-bold outline-none disabled:opacity-50" />
                  </div>
                  <div className="space-y-1.5 p-4 bg-green-50/30 rounded-2xl border border-green-100/50">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-green-600 ml-1">Compra Ivani</label>
                    <input disabled={editingTriagem.status === 'finalizada'} type="number" min="0" value={formValues.quantidade_compra_ivani} onChange={(e) => setFormValues(prev => ({ ...prev, quantidade_compra_ivani: parseInt(e.target.value || "0") }))} className="w-full px-4 py-3 bg-white border border-brand-pink/20 rounded-xl text-sm font-black outline-none text-green-600 disabled:opacity-50" />
                  </div>
                </div>

                <div className="p-5 bg-green-50 rounded-2xl border border-green-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-700 font-bold text-[10px] uppercase tracking-widest">
                      <DollarSign size={14} /> Preço Unitário de Compra
                    </div>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600">R$</span>
                       <input 
                        disabled={editingTriagem.status === 'finalizada'}
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formValues.valor_unitario_compra}
                        onChange={(e) => setFormValues(prev => ({ ...prev, valor_unitario_compra: parseFloat(e.target.value || "0") }))}
                        className="w-28 pl-8 pr-3 py-2 bg-white border border-green-200 rounded-lg text-xs font-black text-green-700 outline-none text-right disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t border-green-200/50">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-2">
                      <ArrowDownCircle size={14} /> Abatimento de Saldo
                    </span>
                    <div className="text-2xl font-black text-green-700">
                      {valorTotalCompra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Observações da Triagem</label>
                  <textarea disabled={editingTriagem.status === 'finalizada'} value={formValues.observacao} onChange={(e) => setFormValues(prev => ({ ...prev, observacao: e.target.value }))} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none min-h-[60px] resize-none disabled:opacity-50" />
                </div>

                <div className="flex gap-3">
                  {editingTriagem.status !== 'finalizada' ? (
                    <>
                      <button type="button" onClick={() => handleUpdateTriagem(false)} disabled={isSubmitting || sucataCalculada < 0} className="flex-1 px-6 py-3 border border-brand-cyan text-brand-cyan rounded-xl text-xs font-bold hover:bg-brand-cyan/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Rascunho
                      </button>
                      <button type="button" onClick={() => handleUpdateTriagem(true)} disabled={isSubmitting || sucataCalculada < 0} className="flex-[1.5] px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg hover:bg-[#1a6e74] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Finalizar Triagem
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full px-6 py-3 bg-gray-100 text-text-dark/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      <Lock size={16} /> Triagem Finalizada — Somente Leitura
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
