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
  Calculator,
  History,
  Lock,
  Eye,
  Trash2,
  Plus,
  Box,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";

// --- TIPAGEM ---

interface ModeloPallet {
  id: string;
  nome: string;
  codigo: string;
  medidas: string;
}

interface TriagemItem {
  id?: string;
  triagem_id: string;
  modelo_pallet_id: string;
  quantidade_reforma: number;
  quantidade_remanufatura: number;
  quantidade_compra_ivani: number;
  // Join data
  modelo_pallet?: ModeloPallet;
}

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
  status: 'em_triagem' | 'classificada' | 'finalizada';
  observacao: string;
  created_at: string;
  // Itens vinculados
  itens?: TriagemItem[];
}

const supabase = createClient();

export default function AdminTriagemPage() {
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [modelosPallets, setModelosPallets] = useState<ModeloPallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTriagem, setEditingTriagem] = useState<Triagem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados do formulário de itens
  const [itensForm, setItensForm] = useState<TriagemItem[]>([]);
  const [observacaoForm, setObservacaoForm] = useState("");

  const fetchTriagens = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Buscar triagens (Simples e Direto)
      const { data: triagensData, error: fetchError } = await supabase
        .from("triagens")
        .select("*")
        .eq("cliente_id", "pce")
        .order("created_at", { ascending: false });

      console.log("TRIAGENS BRUTAS:", triagensData);

      if (fetchError) {
        console.error("Erro na query de triagens:", fetchError);
        setError("Erro ao carregar triagens: " + fetchError.message);
        return;
      }

      if (!triagensData || triagensData.length === 0) {
        setTriagens([]);
        return;
      }

      // 2. Buscar todos os itens das triagens listadas
      const triagemIds = triagensData.map(t => t.id);
      const { data: itensData, error: itensError } = await supabase
        .from("triagem_itens")
        .select(`
          *,
          modelo_pallet:modelos_pallets(id, nome, codigo, medidas)
        `)
        .in("triagem_id", triagemIds);

      if (itensError) {
        console.warn("Aviso: Falha ao carregar detalhes dos itens:", itensError);
      }

      // 3. Mesclar os itens em suas respectivas triagens
      const triagensMapeadas = triagensData.map(t => ({
        ...t,
        itens: itensData?.filter(it => it.triagem_id === t.id) || []
      }));

      setTriagens(triagensMapeadas);
    } catch (err: any) {
      console.error("Erro crítico na página de triagem:", err);
      setError("Falha crítica ao carregar triagens.");
    } finally {
      setLoading(false);
    }
  };

  const fetchModelos = async () => {
    const { data } = await supabase
      .from("modelos_pallets")
      .select("id, nome, codigo, medidas")
      .eq("ativo", true)
      .order("nome");
      setModelosPallets(data || []);
  };

  const sortedTriagens = useMemo(() => {
    return [...triagens].sort((a, b) => {
      const getPriority = (t: Triagem) => {
        const totalClassificado = (t.quantidade_manutencao || 0) + (t.quantidade_remanufatura || 0) + (t.quantidade_compra_ivani || 0);
        const temItens = t.itens && t.itens.length > 0;
        
        if (t.status === 'finalizada') return 3; // Finalizada (Última)
        if (!temItens || totalClassificado === 0) return 1; // Não triada/Pendente (Primeira)
        return 2; // Em andamento
      };

      const pA = getPriority(a);
      const pB = getPriority(b);

      if (pA !== pB) return pA - pB;
      
      // Mesmo grupo, ordenar por data decrescente
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [triagens]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);
    };
    getUser();
    fetchTriagens();
    fetchModelos();
  }, []);

  useEffect(() => {
    if (editingTriagem) {
      setObservacaoForm(editingTriagem.observacao || "");
      // Carregar itens existentes ou iniciar vazio
      if (editingTriagem.itens && editingTriagem.itens.length > 0) {
        setItensForm(editingTriagem.itens.map(item => ({
          ...item,
          quantidade_reforma: item.quantidade_reforma || 0,
          quantidade_remanufatura: item.quantidade_remanufatura || 0,
          quantidade_compra_ivani: item.quantidade_compra_ivani || 0
        })));
      } else {
        setItensForm([]);
      }
    }
  }, [editingTriagem]);

  // --- CÁLCULOS ---

  const somaClassificada = useMemo(() => {
    return itensForm.reduce((acc, item) => 
      acc + item.quantidade_reforma + item.quantidade_remanufatura + item.quantidade_compra_ivani, 0
    );
  }, [itensForm]);

  const sucataCalculada = useMemo(() => {
    if (!editingTriagem) return 0;
    return editingTriagem.quantidade_total - somaClassificada;
  }, [editingTriagem, somaClassificada]);

  const porcentagemClassificada = useMemo(() => {
    if (!editingTriagem || editingTriagem.quantidade_total === 0) return 0;
    return Math.min(100, (somaClassificada / editingTriagem.quantidade_total) * 100);
  }, [editingTriagem, somaClassificada]);

  // --- AÇÕES DO FORMULÁRIO ---

  const handleAddItem = () => {
    // Pegar o primeiro modelo disponível que ainda não está na lista
    const disponivel = modelosPallets.find(m => !itensForm.some(it => it.modelo_pallet_id === m.id));
    if (!disponivel) {
      alert("Todos os modelos disponíveis já foram adicionados.");
      return;
    }

    setItensForm(prev => [...prev, {
      triagem_id: editingTriagem!.id,
      modelo_pallet_id: disponivel.id,
      quantidade_reforma: 0,
      quantidade_remanufatura: 0,
      quantidade_compra_ivani: 0,
      modelo_pallet: disponivel
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItensForm(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemField = (index: number, field: keyof TriagemItem, value: any) => {
    setItensForm(prev => {
      const newItens = [...prev];
      if (field === 'modelo_pallet_id') {
        const modelo = modelosPallets.find(m => m.id === value);
        newItens[index] = { ...newItens[index], [field]: value, modelo_pallet: modelo };
      } else {
        newItens[index] = { ...newItens[index], [field]: value };
      }
      return newItens;
    });
  };

  const handleSaveTriagem = async (finalizar: boolean = false) => {
    if (!editingTriagem) return;

    if (somaClassificada > editingTriagem.quantidade_total) {
      alert(`A soma classificada (${somaClassificada}) não pode exceder o total coletado (${editingTriagem.quantidade_total}).`);
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Calcular totais para atualização do cabeçalho
      const totalReforma = itensForm.reduce((acc, it) => acc + it.quantidade_reforma, 0);
      const totalRemanufatura = itensForm.reduce((acc, it) => acc + it.quantidade_remanufatura, 0);
      const totalCompra = itensForm.reduce((acc, it) => acc + it.quantidade_compra_ivani, 0);

      // 2. Atualizar Triagem (Cabeçalho)
      const novosDadosTriagem = {
        status: finalizar ? 'finalizada' : 'classificada',
        quantidade_manutencao: totalReforma,
        quantidade_remanufatura: totalRemanufatura,
        quantidade_compra_ivani: totalCompra,
        quantidade_sucata: sucataCalculada,
        observacao: observacaoForm
      };

      const { error: errorTriagem } = await supabase
        .from("triagens")
        .update(novosDadosTriagem)
        .eq("id", editingTriagem.id);

      if (errorTriagem) throw errorTriagem;

      // 3. Atualizar Itens (Sincronização: Deletar antigos e inserir novos para garantir integridade)
      // Em um cenário de produção com alto volume, faríamos UPSERT, mas aqui DELETE/INSERT é mais seguro e simples para garantir que itens removidos sumam.
      const { error: errorDelete } = await supabase
        .from("triagem_itens")
        .delete()
        .eq("triagem_id", editingTriagem.id);
      
      if (errorDelete) throw errorDelete;

      if (itensForm.length > 0) {
        const itensParaInserir = itensForm.map(it => ({
          triagem_id: it.triagem_id,
          modelo_pallet_id: it.modelo_pallet_id,
          quantidade_reforma: it.quantidade_reforma,
          quantidade_remanufatura: it.quantidade_remanufatura,
          quantidade_compra_ivani: it.quantidade_compra_ivani
        }));

        const { error: errorInsert } = await supabase
          .from("triagem_itens")
          .insert(itensParaInserir);
        
        if (errorInsert) throw errorInsert;
      }

      // 4. Auditoria
      await supabase.from("triagem_auditoria").insert({
        triagem_id: editingTriagem.id,
        usuario_id: userId,
        acao: finalizar ? "finalizado" : "editado",
        dados_antes: editingTriagem,
        dados_depois: { ...editingTriagem, ...novosDadosTriagem, itens: itensForm },
        observacao: finalizar ? "Triagem finalizada com itens" : "Edição de itens da triagem"
      });

      setIsModalOpen(false);
      setEditingTriagem(null);
      fetchTriagens();
    } catch (err: any) {
      alert("Erro ao salvar triagem: " + err.message);
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
                  <span className="font-bold text-sm leading-none text-brand-cyan">Triagem por Modelo</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin</span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1 ml-6">
                <Link href="/admin/lotes" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Lotes</Link>
                <Link href="/admin/coleta" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Coletas</Link>
                <Link href="/admin/triagem" className="px-4 py-2 bg-brand-cyan/5 text-brand-cyan rounded-lg text-xs font-bold">Triagem</Link>
                <Link href="/admin/configuracao" className="px-4 py-2 text-text-dark/40 hover:text-text-dark/60 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all">Configuração</Link>
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
          <h1 className="text-2xl font-bold tracking-tight">Triagem Técnica (PCE)</h1>
          <p className="text-text-dark/50 text-sm mt-1">Classifique a carga coletada por modelo de pallet e estado físico.</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-cyan" size={32} />
            <p className="text-xs font-bold text-text-dark/30 uppercase tracking-widest text-center">Processando dados...</p>
          </div>
        ) : triagens.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-3xl border border-brand-pink/20">
            <ClipboardList className="mx-auto text-text-dark/10 mb-4" size={64} />
            <h3 className="text-lg font-bold text-text-dark/60">Sem triagens pendentes</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTriagens.map((item) => {
              const totalClassificado = (item.quantidade_manutencao || 0) + (item.quantidade_remanufatura || 0) + (item.quantidade_compra_ivani || 0);
              const temItens = item.itens && item.itens.length > 0;
              const isPendente = (!temItens || totalClassificado === 0) && item.status !== 'finalizada';
              const isEmAndamento = temItens && totalClassificado > 0 && item.status !== 'finalizada';
              const isFinalizada = item.status === 'finalizada';

              return (
                <motion.div 
                  key={item.id} 
                  layout 
                  className={`bg-white rounded-3xl border p-6 card-shadow transition-all group relative
                    ${isPendente ? 'border-orange-200 bg-orange-50/10' : 'border-brand-pink/20'}
                    ${isFinalizada ? 'opacity-80' : 'hover:border-brand-cyan/30'}
                  `}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                        ${isPendente ? 'bg-orange-100 text-orange-500' : isFinalizada ? 'bg-gray-100 text-gray-400' : 'bg-brand-cyan/5 text-brand-cyan'}
                      `}>
                        {isPendente ? <AlertCircle size={20} /> : <Activity size={20} />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">Status</span>
                        <div className={`text-[10px] font-bold uppercase flex items-center gap-1.5
                          ${isFinalizada ? 'text-green-600' : isPendente ? 'text-orange-500' : 'text-brand-cyan'}
                        `}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFinalizada ? 'bg-green-600 animate-none' : isPendente ? 'bg-orange-500' : 'bg-brand-cyan'}`} />
                          {isFinalizada ? 'Finalizada' : isPendente ? 'Aguardando triagem' : 'Em classificação'}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setEditingTriagem(item); setIsModalOpen(true); }}
                      className={`p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest 
                        ${isFinalizada ? 'text-text-dark/40 bg-gray-50' : isPendente ? 'text-orange-600 bg-orange-100/50 hover:bg-orange-100' : 'text-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/10'}
                      `}
                    >
                      {isFinalizada ? <><Eye size={14} /> Detalhes</> : <><Edit3 size={14} /> Classificar</>}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {isPendente && (
                      <div className="bg-orange-100/30 p-3 rounded-2xl border border-orange-200/30 mb-2">
                        <p className="text-[10px] font-bold text-orange-600 leading-tight">
                          Esta carga ainda precisa ser classificada. Clique em "Classificar" para iniciar a separação por modelo.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-end pb-4 border-b border-brand-pink/5">
                      <div>
                        <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Carga Bruta</span>
                        <div className="text-2xl font-black text-text-dark">{item.quantidade_total} <span className="text-xs font-bold text-text-dark/20 uppercase tracking-tighter">un</span></div>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block mb-1">Classificado</span>
                         <div className={`text-sm font-black ${isPendente ? 'text-text-dark/20' : 'text-brand-cyan'}`}>{totalClassificado} un</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {temItens ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.itens!.slice(0, 3).map(it => (
                            <div key={it.id} className="px-2 py-1 bg-bg-primary rounded-lg text-[9px] font-bold text-text-dark/60 border border-brand-pink/5">
                              {it.modelo_pallet?.codigo || it.modelo_pallet?.nome.split(' ')[0]}
                            </div>
                          ))}
                          {item.itens!.length > 3 && <div className="px-2 py-1 bg-gray-50 rounded-lg text-[9px] font-bold text-text-dark/30">+{item.itens!.length - 3}</div>}
                        </div>
                      ) : (
                        <div className="text-[10px] font-medium text-text-dark/30 italic">Sem itens classificados</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className={`p-3 rounded-2xl border ${isPendente ? 'bg-gray-50/50 border-gray-100' : 'bg-red-50/50 border-red-100/50'}`}>
                        <span className={`text-[9px] font-bold uppercase tracking-tighter block mb-1 ${isPendente ? 'text-text-dark/20' : 'text-red-500'}`}>Sucata (Resto)</span>
                        <div className={`text-base font-bold ${isPendente ? 'text-text-dark/20' : 'text-red-500'}`}>{isPendente ? '-' : item.quantidade_sucata}</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isPendente ? 'bg-gray-50/50 border-gray-100' : 'bg-brand-cyan/5 border-brand-cyan/10'}`}>
                        <span className={`text-[9px] font-bold uppercase tracking-tighter block mb-1 ${isPendente ? 'text-text-dark/20' : 'text-brand-cyan'}`}>Compra Ivani</span>
                        <div className={`text-base font-bold ${isPendente ? 'text-text-dark/20' : 'text-brand-cyan'}`}>{isPendente ? '-' : item.quantidade_compra_ivani}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && editingTriagem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              
              {/* Header Modal */}
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                    {editingTriagem.status === 'finalizada' ? <Lock size={20} /> : <Calculator size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{editingTriagem.status === 'finalizada' ? "Triagem Finalizada" : "Classificação por Modelo"}</h3>
                    <p className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest mt-0.5">NF: {editingTriagem.nf_saida_pce || "S/NF"} — Total: {editingTriagem.quantidade_total} un</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>

              {/* Barra de Progresso */}
              <div className="px-8 pt-6 pb-2">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black text-brand-cyan">{porcentagemClassificada.toFixed(0)}% Classificada</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${sucataCalculada < 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                       <AlertCircle size={12} /> {sucataCalculada < 0 ? `Excesso de ${Math.abs(sucataCalculada)} un` : `${sucataCalculada} un restantes (Sucata)`}
                    </span>
                 </div>
                 <div className="w-full h-3 bg-bg-primary rounded-full overflow-hidden border border-brand-pink/10 p-0.5 shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${porcentagemClassificada}%` }} className={`h-full rounded-full ${sucataCalculada < 0 ? 'bg-red-500' : 'bg-brand-cyan'} transition-all`} />
                 </div>
              </div>

              <div className="p-8 space-y-6 pt-4">
                
                {/* Cabeçalho da Lista de Itens */}
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dark/40">Decomposição da Carga</h4>
                  {editingTriagem.status !== 'finalizada' && (
                    <button 
                      onClick={handleAddItem}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-brand-cyan hover:text-[#1a6e74] transition-colors bg-brand-cyan/5 px-3 py-1.5 rounded-lg border border-brand-cyan/10"
                    >
                      <Plus size={14} /> Adicionar Modelo
                    </button>
                  )}
                </div>

                {/* Lista de Modelos */}
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {itensForm.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                      <Box className="mx-auto text-text-dark/10 mb-3" size={32} />
                      <p className="text-[11px] font-bold text-text-dark/30 uppercase tracking-widest">Nenhum modelo classificado</p>
                    </div>
                  ) : (
                    itensForm.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-brand-pink/20 p-4 shadow-sm hover:border-brand-cyan/20 transition-all">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Seleção do Modelo */}
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Modelo de Pallet</label>
                            <div className="relative">
                              <select 
                                disabled={editingTriagem.status === 'finalizada'}
                                value={item.modelo_pallet_id} 
                                onChange={(e) => handleUpdateItemField(idx, 'modelo_pallet_id', e.target.value)}
                                className="w-full appearance-none px-4 py-2.5 bg-bg-primary border border-brand-pink/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60"
                              >
                                {modelosPallets.map(m => (
                                  <option key={m.id} value={m.id}>{m.codigo ? `[${m.codigo}] ` : ""}{m.nome} ({m.medidas})</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dark/30 pointer-events-none" size={14} />
                            </div>
                          </div>

                          {/* Quantidades */}
                          <div className="grid grid-cols-3 gap-2 flex-[1.5]">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold uppercase tracking-tighter text-amber-600/70 ml-1">Reforma</label>
                              <input 
                                disabled={editingTriagem.status === 'finalizada'}
                                type="number" min="0" 
                                value={item.quantidade_reforma} 
                                onChange={(e) => handleUpdateItemField(idx, 'quantidade_reforma', parseInt(e.target.value || "0"))}
                                className="w-full px-3 py-2.5 bg-amber-50/30 border border-amber-100 rounded-xl text-xs font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-200" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold uppercase tracking-tighter text-purple-600/70 ml-1">Remanuf.</label>
                              <input 
                                disabled={editingTriagem.status === 'finalizada'}
                                type="number" min="0" 
                                value={item.quantidade_remanufatura} 
                                onChange={(e) => handleUpdateItemField(idx, 'quantidade_remanufatura', parseInt(e.target.value || "0"))}
                                className="w-full px-3 py-2.5 bg-purple-50/30 border border-purple-100 rounded-xl text-xs font-bold text-purple-700 outline-none focus:ring-2 focus:ring-purple-200" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold uppercase tracking-tighter text-brand-cyan ml-1">Compra</label>
                              <input 
                                disabled={editingTriagem.status === 'finalizada'}
                                type="number" min="0" 
                                value={item.quantidade_compra_ivani} 
                                onChange={(e) => handleUpdateItemField(idx, 'quantidade_compra_ivani', parseInt(e.target.value || "0"))}
                                className="w-full px-3 py-2.5 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl text-xs font-bold text-brand-cyan outline-none focus:ring-2 focus:ring-brand-cyan/20" 
                              />
                            </div>
                          </div>

                          {/* Botão Remover */}
                          {editingTriagem.status !== 'finalizada' && (
                            <button 
                              onClick={() => handleRemoveItem(idx)}
                              className="self-end md:self-center p-2.5 text-text-dark/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Observações da Triagem</label>
                  <textarea 
                    disabled={editingTriagem.status === 'finalizada'} 
                    value={observacaoForm} 
                    onChange={(e) => setObservacaoForm(e.target.value)} 
                    className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none min-h-[70px] resize-none focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60" 
                    placeholder="Notas adicionais sobre a carga..." 
                  />
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-2">
                  {editingTriagem.status !== 'finalizada' ? (
                    <>
                      <button type="button" onClick={() => handleSaveTriagem(false)} disabled={isSubmitting || sucataCalculada < 0} className="flex-1 px-6 py-3 border border-brand-cyan text-brand-cyan rounded-xl text-xs font-bold hover:bg-brand-cyan/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Rascunho
                      </button>
                      <button type="button" onClick={() => handleSaveTriagem(true)} disabled={isSubmitting || sucataCalculada < 0} className="flex-[1.5] px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg hover:bg-[#1a6e74] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Finalizar
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full px-6 py-3 bg-gray-100 text-text-dark/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      <Lock size={16} /> Triagem Bloqueada (Finalizada)
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
