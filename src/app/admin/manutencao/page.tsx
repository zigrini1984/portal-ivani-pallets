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
  Activity,
  CheckCircle2,
  History,
  Lock,
  Eye,
  Wrench,
  Hammer,
  Trash2,
  Package
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { sincronizarEstoqueOperacional } from "@/lib/services/estoque";

interface ModeloPallet {
  id: string;
  nome: string;
  codigo: string;
  medidas: string;
}

interface TriagemItem {
  id: string;
  triagem_id: string;
  modelo_pallet_id: string;
  quantidade_reforma: number;
  modelo_pallet?: ModeloPallet;
  triagem?: {
    nf_saida_pce: string;
    data_coleta: string;
    status: string;
  };
}

interface Manutencao {
  id?: string;
  triagem_id: string;
  modelo_pallet_id: string;
  quantidade_entrada: number;
  quantidade_concluida: number;
  quantidade_sucata: number;
  status: 'aguardando' | 'em_andamento' | 'finalizada';
  observacao: string;
  created_at?: string;
  updated_at?: string;
}

const supabase = createClient();

export default function AdminManutencaoPage() {
  const [itemsPendente, setItemsPendente] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do formulário
  const [formConcluida, setFormConcluida] = useState(0);
  const [formSucata, setFormSucata] = useState(0);
  const [formObservacao, setFormObservacao] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Buscar itens de triagem que precisam de reforma
      const { data: triagemItens, error: itError } = await supabase
        .from("triagem_itens")
        .select(`
          *,
          modelo_pallet:modelos_pallets(id, nome, codigo, medidas),
          triagem:triagens(id, nf_saida_pce, data_coleta, status, cliente_id)
        `)
        .gt("quantidade_reforma", 0)
        .eq("triagens.cliente_id", "pce");

      if (itError) throw itError;

      // 2. Buscar manutenções existentes
      const { data: manutencoes, error: mError } = await supabase
        .from("manutencoes")
        .select("*")
        .eq("cliente_id", "pce");

      if (mError) throw mError;

      // 3. Mesclar dados
      const listagem = triagemItens.map(it => {
        const manut = manutencoes?.find(m => m.triagem_id === it.triagem_id && m.modelo_pallet_id === it.modelo_pallet_id);
        return {
          ...it,
          manutencao: manut || null,
          quantidade_entrada: it.quantidade_reforma,
          quantidade_concluida: manut?.quantidade_concluida || 0,
          quantidade_sucata: manut?.quantidade_sucata || 0,
          status: manut?.status || 'aguardando',
          observacao: manut?.observacao || ""
        };
      });

      setItemsPendente(listagem);
    } catch (err: any) {
      console.error("Erro Manutenção:", err);
      setError("Erro ao carregar dados de manutenção.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormConcluida(editingItem.quantidade_concluida || 0);
      setFormSucata(editingItem.quantidade_sucata || 0);
      setFormObservacao(editingItem.observacao || "");
    }
  }, [editingItem]);

  const saldoPendente = useMemo(() => {
    if (!editingItem) return 0;
    return editingItem.quantidade_entrada - formConcluida - formSucata;
  }, [editingItem, formConcluida, formSucata]);

  const handleSave = async () => {
    if (!editingItem) return;

    if (formConcluida + formSucata > editingItem.quantidade_entrada) {
      alert("A soma de concluídos e sucata não pode exceder a entrada.");
      return;
    }

    try {
      setIsSubmitting(true);

      const novoStatus = (formConcluida + formSucata === editingItem.quantidade_entrada) 
        ? 'finalizada' 
        : (formConcluida + formSucata > 0) ? 'em_andamento' : 'aguardando';

      const payload = {
        cliente_id: 'pce',
        triagem_id: editingItem.triagem_id,
        modelo_pallet_id: editingItem.modelo_pallet_id,
        quantidade_entrada: editingItem.quantidade_entrada,
        quantidade_concluida: formConcluida,
        quantidade_sucata: formSucata,
        status: novoStatus,
        observacao: formObservacao,
        updated_at: new Date().toISOString()
      };

      if (editingItem.manutencao?.id) {
        // Update
        const { error: upError } = await supabase
          .from("manutencoes")
          .update(payload)
          .eq("id", editingItem.manutencao.id);
        if (upError) throw upError;
      } else {
        // Insert
        const { error: inError } = await supabase
          .from("manutencoes")
          .insert([payload]);
        if (inError) throw inError;
      }

      await fetchData();
      await sincronizarEstoqueOperacional();
      setIsModalOpen(false);
      setEditingItem(null);
      alert("Manutenção atualizada com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedItems = useMemo(() => {
    return [...itemsPendente].sort((a, b) => {
      const getPriority = (s: string) => {
        if (s === 'aguardando') return 1;
        if (s === 'em_andamento') return 2;
        return 3;
      };
      const pA = getPriority(a.status);
      const pB = getPriority(b.status);
      if (pA !== pB) return pA - pB;
      return new Date(b.created_at || b.triagem?.data_coleta).getTime() - new Date(a.created_at || a.triagem?.data_coleta).getTime();
    });
  }, [itemsPendente]);

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
                  <Wrench className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Oficina de Manutenção</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin</span>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Link href="/admin/coleta" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Coletas</Link>
              <Link href="/admin/triagem" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Triagem</Link>
              <Link href="/admin/manutencao" className="px-4 py-2 bg-brand-cyan/5 text-brand-cyan rounded-lg text-xs font-bold transition-all">Manutenção</Link>
              <Link href="/admin/estoque" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Estoque</Link>
              <Link href="/admin/faturamento" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Faturamento</Link>
              <Link href="/admin/configuracao" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Configuração</Link>
              <Link href="/admin/relatorios" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Relatórios</Link>
            </nav>

            <div className="flex items-center gap-4">
               <button onClick={() => logout()} className="p-2 text-text-dark/40 hover:text-red-500 transition-colors" title="Sair"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-dark">Controle de Oficina</h1>
          <p className="text-text-dark/50 text-sm mt-1">Gerencie pallets em reforma e registre perdas por sucata.</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-cyan" size={32} />
            <p className="text-xs font-bold text-text-dark/30 uppercase tracking-widest text-center">Acessando oficina...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
            <h3 className="text-lg font-bold text-text-dark/60">{error}</h3>
            <button onClick={() => fetchData()} className="mt-4 text-brand-cyan font-bold text-sm underline">Tentar novamente</button>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-3xl border border-brand-pink/20 card-shadow">
            <Hammer className="mx-auto text-text-dark/10 mb-4" size={64} />
            <h3 className="text-lg font-bold text-text-dark/60">Nenhum pallet para manutenção</h3>
            <p className="text-sm text-text-dark/40 mt-2">Novos itens aparecerão aqui após serem triados como 'Reforma'.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => {
              const pendente = item.quantidade_entrada - item.quantidade_concluida - item.quantidade_sucata;
              const isFinalizado = item.status === 'finalizada';
              const isAguardando = item.status === 'aguardando';

              return (
                <motion.div 
                  key={item.id}
                  layout
                  className={`bg-white rounded-3xl border p-6 card-shadow transition-all relative overflow-hidden group
                    ${isAguardando ? 'border-amber-100' : isFinalizado ? 'border-green-100 opacity-80' : 'border-brand-cyan/20'}
                  `}
                >
                  {isAguardando && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400/40" />}
                  {isFinalizado && <div className="absolute top-0 left-0 right-0 h-1 bg-green-400/40" />}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                        ${isAguardando ? 'bg-amber-50 text-amber-600' : isFinalizado ? 'bg-green-50 text-green-600' : 'bg-brand-cyan/5 text-brand-cyan'}
                      `}>
                        {isFinalizado ? <CheckCircle2 size={20} /> : <Wrench size={20} />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Status</span>
                        <div className={`text-[10px] font-bold uppercase flex items-center gap-1.5
                          ${isFinalizado ? 'text-green-600' : isAguardando ? 'text-amber-600' : 'text-brand-cyan'}
                        `}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isFinalizado ? 'bg-green-600' : isAguardando ? 'bg-amber-500 animate-pulse' : 'bg-brand-cyan animate-pulse'}`} />
                          {item.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className={`p-2 px-3 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest 
                        ${isFinalizado ? 'text-text-dark/40 bg-gray-50 hover:bg-gray-100' : 'text-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/10'}
                      `}
                    >
                      {isFinalizado ? <><Eye size={14} /> Ver</> : <><Hammer size={14} /> Atualizar</>}
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={14} className="text-text-dark/30" />
                      <span className="text-sm font-black text-text-dark">{item.modelo_pallet?.nome || "Modelo Indefinido"}</span>
                    </div>
                    <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">
                      Ref: {item.triagem?.nf_saida_pce || "S/NF"} — {new Date(item.triagem?.data_coleta).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-bg-primary rounded-2xl p-3 border border-brand-pink/5">
                      <span className="text-[9px] font-bold text-text-dark/40 uppercase block mb-1">Entrada</span>
                      <div className="text-lg font-black text-text-dark">{item.quantidade_entrada}</div>
                    </div>
                    <div className="bg-green-50/30 rounded-2xl p-3 border border-green-100/30">
                      <span className="text-[9px] font-bold text-green-600 uppercase block mb-1">OK</span>
                      <div className="text-lg font-black text-green-600">{item.quantidade_concluida}</div>
                    </div>
                    <div className="bg-red-50/30 rounded-2xl p-3 border border-red-100/30">
                      <span className="text-[9px] font-bold text-red-500 uppercase block mb-1">Sucata</span>
                      <div className="text-lg font-black text-red-500">{item.quantidade_sucata}</div>
                    </div>
                  </div>

                  {pendente > 0 && (
                    <div className="mt-4 pt-4 border-t border-brand-pink/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest">Pendente para reforma</span>
                      <span className="text-sm font-black text-amber-600">{pendente} un</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                    <Hammer size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Atualizar Manutenção</h3>
                    <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mt-0.5">{editingItem.modelo_pallet?.nome} — Total {editingItem.quantidade_entrada} un</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Qtd. Reformada (OK)</label>
                    <input 
                      type="number" 
                      value={formConcluida}
                      onChange={(e) => setFormConcluida(Number(e.target.value))}
                      className="w-full bg-bg-primary border-none rounded-2xl px-5 py-4 text-lg font-bold focus:ring-2 focus:ring-brand-cyan transition-all"
                      placeholder="0"
                      disabled={editingItem.status === 'finalizada'}
                    />
                    <p className="text-[10px] text-text-dark/40 italic">Pallets prontos para uso.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Qtd. Sucateada (Perda)</label>
                    <input 
                      type="number" 
                      value={formSucata}
                      onChange={(e) => setFormSucata(Number(e.target.value))}
                      className="w-full bg-bg-primary border-none rounded-2xl px-5 py-4 text-lg font-bold focus:ring-2 focus:ring-red-500 transition-all text-red-500"
                      placeholder="0"
                      disabled={editingItem.status === 'finalizada'}
                    />
                    <p className="text-[10px] text-text-dark/40 italic">Pallets perdidos no processo.</p>
                  </div>
                </div>

                <div className="bg-bg-primary rounded-3xl p-6 border border-brand-pink/5 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Saldo Atual Pendente</span>
                    <div className={`text-2xl font-black ${saldoPendente < 0 ? 'text-red-500' : 'text-brand-cyan'}`}>
                      {saldoPendente} <span className="text-xs font-bold opacity-30">un</span>
                    </div>
                  </div>
                  {saldoPendente === 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Tudo Processado</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Observações da Oficina</label>
                  <textarea 
                    value={formObservacao}
                    onChange={(e) => setFormObservacao(e.target.value)}
                    className="w-full bg-bg-primary border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-brand-cyan transition-all min-h-[100px]"
                    placeholder="Ex: Pallets com avaria grave na base..."
                    disabled={editingItem.status === 'finalizada'}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-sm text-text-dark/40 hover:bg-gray-50 transition-all border border-transparent hover:border-brand-pink/10"
                  >
                    Cancelar
                  </button>
                  {editingItem.status !== 'finalizada' && (
                    <button 
                      onClick={handleSave}
                      disabled={isSubmitting || saldoPendente < 0}
                      className="flex-[2] bg-brand-cyan text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-brand-cyan/90 transition-all shadow-lg shadow-brand-cyan/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      {saldoPendente === 0 ? "Finalizar Manutenção" : "Salvar Progresso"}
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
