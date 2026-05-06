"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, Edit2, Loader2, X, Save, Box, Maximize2, AlertCircle, 
  History, ShieldCheck, Globe, UserPlus, UserCheck, UserX, Shield, Mail, Lock, Check, Calendar, Users, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageShell, AppCard, AppButton, StatusBadge, EmptyState } from "@/components/ui/tropical";

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

interface LogAcesso {
  id: string;
  usuario_id: string;
  email: string;
  tipo_usuario: string;
  area: string;
  created_at: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  perfil: 'admin' | 'cliente';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminConfiguracaoClientProps {
  initialModelos: ModeloPallet[];
  initialUsuarios: Usuario[];
  initialLogs: LogAcesso[];
}

export function AdminConfiguracaoClient({ initialModelos, initialUsuarios, initialLogs }: AdminConfiguracaoClientProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'modelos' | 'acessos' | 'usuarios'>('modelos');
  const [modelos, setModelos] = useState<ModeloPallet[]>(initialModelos);
  const [logs, setLogs] = useState<LogAcesso[]>(initialLogs);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modais Modelos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloPallet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modais Usuários
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // 1. Buscar Modelos
      const { data: mData, error: mError } = await supabase
        .from("modelos_pallets")
        .select("id, cliente_id, nome, codigo, medidas, preco_pallet_novo, preco_reforma, preco_remanufatura, preco_compra_ivani, ativo, observacao")
        .eq("cliente_id", "pce")
        .order("codigo", { ascending: true });
      
      if (mError) {
        console.error("Erro Modelos:", mError);
        setError("Erro ao carregar modelos");
      } else {
        setModelos(mData || []);
      }

      // 2. Buscar Usuários
      const { data: uData, error: uError } = await supabase
        .from("usuarios")
        .select("*")
        .order("nome", { ascending: true });
      
      if (uError) {
        console.warn("Aviso: Falha ao carregar usuários:", uError);
      } else {
        setUsuarios(uData || []);
      }

      // 3. Buscar Logs de Acesso
      try {
        const { data: lData, error: lError } = await supabase
          .from("portal_acessos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        
        if (lError) {
          console.warn("Aviso: Falha ao carregar logs de acesso:", lError);
        } else {
          setLogs(lData || []);
        }
      } catch (logErr) {
        console.warn("Erro silencioso nos logs:", logErr);
      }

    } catch (err: any) {
      console.error("Erro crítico na página de configuração:", err);
      setError("Falha crítica ao carregar configurações.");
    }
  };

  useEffect(() => {
    // Initial fetch done by Server Component
  }, []);

  // --- FILTROS ---

  const filteredModelos = modelos.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsuarios = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- AÇÕES MODELOS ---

  const handleSubmitModelo = async (e: React.FormEvent<HTMLFormElement>) => {
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
      fetchData();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatusModelo = async (modelo: ModeloPallet) => {
    try {
      const { error: updateError } = await supabase
        .from("modelos_pallets")
        .update({ ativo: !modelo.ativo })
        .eq("id", modelo.id);
      if (updateError) throw updateError;
      fetchData();
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  };

  // --- AÇÕES USUÁRIOS ---

  const handleSubmitUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const userData = {
      nome: formData.get("nome") as string,
      email: (formData.get("email") as string).toLowerCase().trim(),
      senha: formData.get("senha") as string,
      perfil: formData.get("perfil") as 'admin' | 'cliente',
      ativo: true
    };

    // Validações Básicas
    if (!userData.nome || !userData.email || !userData.senha || !userData.perfil) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      alert("Formato de e-mail inválido.");
      return;
    }

    try {
      setIsUserSubmitting(true);
      const { error: insertError } = await supabase
        .from("usuarios")
        .insert([userData]);
      
      if (insertError) throw insertError;

      setSuccessMessage("Usuário criado com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      form.reset();
      setIsUserModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Erro ao criar usuário:", err);
      alert("Erro ao criar usuário: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsUserSubmitting(false);
    }
  };

  const toggleUserStatus = async (usuario: Usuario) => {
    try {
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ ativo: !usuario.ativo })
        .eq("id", usuario.id);
      
      if (updateError) throw updateError;
      
      fetchData();
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  };

  return (
    <PageShell hideHeader={true}
      title="Configurações do Sistema"
      subtitle="Gerencie modelos, usuários e monitore a atividade do portal."
      actions={
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-brand-mirage/10 shadow-sm overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('modelos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'modelos' ? 'bg-brand-teal text-white shadow-md' : 'text-brand-mirage/60 hover:bg-brand-sand/30'}`}
          >
            <Box size={16} /> Modelos & Preços
          </button>
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'usuarios' ? 'bg-brand-teal text-white shadow-md' : 'text-brand-mirage/60 hover:bg-brand-sand/30'}`}
          >
            <Users size={16} /> Usuários
          </button>
          <button 
            onClick={() => setActiveTab('acessos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'acessos' ? 'bg-brand-teal text-white shadow-md' : 'text-brand-mirage/60 hover:bg-brand-sand/30'}`}
          >
            <History size={16} /> Acessos
          </button>
        </div>
      }
    >
      {loading ? (
        <LoadingScreen 
          message="Carregando Painel" 
          subMessage="Ivani Pallets — Configurações do Sistema"
        />
      ) : error ? (
        <div className="mb-8 bg-red-50 border border-red-100 rounded-3xl p-5 flex flex-col items-center justify-center py-12 gap-3 text-center">
          <AlertCircle className="text-red-500" size={40} />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'modelos' && (
            <motion.div 
              key="modelos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-mirage/30" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou código..." 
                    className="pl-12 pr-4 py-3 bg-white border border-brand-mirage/10 rounded-2xl text-xs font-bold text-brand-mirage w-full outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <AppButton 
                  onClick={() => { setEditingModelo(null); setIsModalOpen(true); }}
                  icon={<Plus size={18} />}
                >
                  Novo Modelo
                </AppButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModelos.map((item) => (
                  <AppCard key={item.id} className={`relative overflow-hidden ${!item.ativo ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.ativo ? 'bg-brand-sand/50 text-brand-orange' : 'bg-gray-100 text-gray-400'}`}>
                          <Box size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-brand-mirage/40 uppercase tracking-widest block mb-0.5">{item.codigo || "S/ COD"}</span>
                          <h3 className="text-sm font-black text-brand-mirage">{item.nome}</h3>
                        </div>
                      </div>
                      <button onClick={() => { setEditingModelo(item); setIsModalOpen(true); }} className="p-2 text-brand-mirage/20 hover:text-brand-teal transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-brand-mirage/50 text-[11px] font-bold">
                        <Maximize2 size={14} /> {item.medidas || "Medidas N/A"}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-brand-mirage/5">
                        <div className="bg-[#FAFAFA] p-3 rounded-2xl border border-brand-mirage/5">
                          <span className="text-[9px] font-black text-brand-mirage/40 uppercase tracking-tighter block mb-1">Reforma</span>
                          <div className="text-sm font-black text-brand-mirage">R$ {item.preco_reforma.toFixed(2)}</div>
                        </div>
                        <div className="bg-[#FAFAFA] p-3 rounded-2xl border border-brand-mirage/5">
                          <span className="text-[9px] font-black text-brand-mirage/40 uppercase tracking-tighter block mb-1">Remanuf.</span>
                          <div className="text-sm font-black text-brand-mirage">R$ {item.preco_remanufatura.toFixed(2)}</div>
                        </div>
                        <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter block mb-1">Compra Ivani</span>
                          <div className="text-sm font-black text-emerald-700">R$ {item.preco_compra_ivani.toFixed(2)}</div>
                        </div>
                        <div className="bg-brand-teal/5 p-3 rounded-2xl border border-brand-teal/10">
                          <span className="text-[9px] font-black text-brand-teal uppercase tracking-tighter block mb-1">Preço Novo</span>
                          <div className="text-sm font-black text-brand-teal">R$ {item.preco_pallet_novo.toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleStatusModelo(item)} 
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${item.ativo ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        {item.ativo ? "Desativar Modelo" : "Ativar Modelo"}
                      </button>
                    </div>
                  </AppCard>
                ))}
                
                {filteredModelos.length === 0 && (
                  <div className="col-span-full">
                    <AppCard>
                      <EmptyState 
                        icon={<Box size={48} />}
                        title="Nenhum modelo encontrado"
                        description="Você ainda não cadastrou nenhum modelo ou a busca não encontrou resultados."
                      />
                    </AppCard>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'usuarios' && (
            <motion.div 
              key="usuarios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-mirage/30" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar usuário por nome ou email..." 
                    className="pl-12 pr-4 py-3 bg-white border border-brand-mirage/10 rounded-2xl text-xs font-bold text-brand-mirage w-full outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <AppButton 
                  onClick={() => setIsUserModalOpen(true)}
                  icon={<UserPlus size={18} />}
                >
                  Novo Usuário
                </AppButton>
              </div>

              <AppCard noPadding>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full min-w-[800px] text-left">
                    <thead>
                      <tr className="bg-brand-sand/50 border-b border-brand-mirage/5">
                        <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Usuário</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">E-mail</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Perfil</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest">Criado em</th>
                        <th className="px-6 py-4 text-[10px] font-black text-brand-mirage/50 uppercase tracking-widest text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-mirage/5">
                      {filteredUsuarios.map((u) => (
                        <tr key={u.id} className="hover:bg-brand-sand/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-brand-teal/10 text-brand-teal rounded-xl flex items-center justify-center font-black text-xs uppercase">
                                {u.nome.charAt(0)}
                              </div>
                              <div className="text-sm font-black text-brand-mirage">{u.nome}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-brand-mirage/60 font-bold">{u.email}</td>
                          <td className="px-6 py-4">
                            <StatusBadge variant={u.perfil === 'admin' ? 'info' : 'warning'}>
                              {u.perfil}
                            </StatusBadge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${u.ativo ? 'text-emerald-600' : 'text-red-500'}`}>
                                {u.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-brand-mirage/40 font-bold uppercase tracking-widest">
                            {new Date(u.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <button 
                                onClick={() => toggleUserStatus(u)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${u.ativo ? 'text-red-400 hover:bg-red-50 border border-transparent hover:border-red-100' : 'text-emerald-500 hover:bg-emerald-50 border border-transparent hover:border-emerald-100'}`}
                                title={u.ativo ? "Desativar" : "Ativar"}
                              >
                                {u.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsuarios.length === 0 && (
                  <EmptyState 
                    icon={<Users size={48} />}
                    title="Nenhum usuário encontrado"
                    description="Não há usuários com os termos pesquisados."
                  />
                )}
              </AppCard>
            </motion.div>
          )}

          {activeTab === 'acessos' && (
            <motion.div 
              key="acessos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AppCard noPadding>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr className="bg-brand-sand/50 border-b border-brand-mirage/5">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-mirage/50">Usuário</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-mirage/50">Tipo</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-mirage/50">Área</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-brand-mirage/50">Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-mirage/5">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-brand-sand/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-brand-mirage/30 border border-brand-mirage/5">
                                <Users size={16} />
                              </div>
                              <div>
                                <div className="text-sm font-black text-brand-mirage">{log.email}</div>
                                <div className="text-[10px] text-brand-mirage/40 font-bold uppercase tracking-widest mt-0.5">ID: {log.usuario_id?.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge variant={log.tipo_usuario === 'admin' ? 'info' : 'warning'}>
                              {log.tipo_usuario}
                            </StatusBadge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-brand-mirage/60 text-[10px] font-black uppercase tracking-widest">
                              {log.area.includes('admin') ? <ShieldCheck size={14} className="text-brand-teal" /> : <Globe size={14} className="text-brand-orange" />}
                              {log.area}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-brand-mirage/60">{new Date(log.created_at).toLocaleString('pt-BR')}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logs.length === 0 && (
                  <EmptyState 
                    icon={<History size={48} />}
                    title="Nenhum registro de acesso"
                    description="O histórico de acesso dos usuários aparecerá aqui."
                  />
                )}
              </AppCard>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modal Modelos */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-brand-mirage/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-mirage/5 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-teal/10 rounded-xl flex items-center justify-center text-brand-teal"><Box size={20} /></div>
                  <h3 className="font-black text-lg text-brand-mirage">{editingModelo ? "Editar Modelo" : "Novo Modelo"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAFAFA] text-brand-mirage/40 hover:bg-brand-mirage/5 hover:text-brand-mirage transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmitModelo} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">Nome do Modelo</label><input name="nome" defaultValue={editingModelo?.nome} required className="w-full px-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">Código Interno</label><input name="codigo" defaultValue={editingModelo?.codigo} className="w-full px-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">Medidas (mm)</label><input name="medidas" defaultValue={editingModelo?.medidas} className="w-full px-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase tracking-tighter text-brand-orange ml-1">Reforma</label><input name="preco_reforma" type="number" step="0.01" defaultValue={editingModelo?.preco_reforma} className="w-full px-3 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-orange/30 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase tracking-tighter text-brand-teal ml-1">Remanuf.</label><input name="preco_remanufatura" type="number" step="0.01" defaultValue={editingModelo?.preco_remanufatura} className="w-full px-3 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase tracking-tighter text-emerald-500 ml-1">Compra</label><input name="preco_compra_ivani" type="number" step="0.01" defaultValue={editingModelo?.preco_compra_ivani} className="w-full px-3 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase tracking-tighter text-brand-mirage/50 ml-1">Novo</label><input name="preco_pallet_novo" type="number" step="0.01" defaultValue={editingModelo?.preco_pallet_novo} className="w-full px-3 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-mirage/30 transition-all" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">Observações</label><textarea name="observacao" defaultValue={editingModelo?.observacao} className="w-full px-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all min-h-[80px] resize-none" /></div>
                <div className="flex gap-3 pt-4">
                  <AppButton type="button" onClick={() => setIsModalOpen(false)} variant="secondary" className="flex-1">Cancelar</AppButton>
                  <AppButton type="submit" disabled={isSubmitting} className="flex-1" icon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}>Salvar</AppButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Usuários */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUserModalOpen(false)} className="absolute inset-0 bg-brand-mirage/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-mirage/5 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-teal/10 rounded-xl flex items-center justify-center text-brand-teal"><UserPlus size={20} /></div>
                  <h3 className="font-black text-lg text-brand-mirage">Novo Usuário</h3>
                </div>
                <button onClick={() => setIsUserModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAFAFA] text-brand-mirage/40 hover:bg-brand-mirage/5 hover:text-brand-mirage transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmitUsuario} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">Nome Completo</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-mirage/30" size={16} />
                    <input name="nome" type="text" required placeholder="Ex: João Silva" className="w-full pl-12 pr-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-mirage/30" size={16} />
                    <input name="email" type="email" required placeholder="usuario@email.com" className="w-full pl-12 pr-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">Senha Provisória</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-mirage/30" size={16} />
                    <input name="senha" type="password" required placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-sm font-bold text-brand-mirage outline-none focus:ring-2 focus:ring-brand-teal/30 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-mirage/50 ml-1">Perfil de Acesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="cursor-pointer">
                      <input type="radio" name="perfil" value="admin" defaultChecked className="peer hidden" />
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-xs font-bold text-brand-mirage/50 peer-checked:bg-brand-teal peer-checked:text-white peer-checked:border-brand-teal transition-all">
                        <Shield size={14} /> Admin
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input type="radio" name="perfil" value="cliente" className="peer hidden" />
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FAFAFA] border border-brand-mirage/10 rounded-xl text-xs font-bold text-brand-mirage/50 peer-checked:bg-brand-teal peer-checked:text-white peer-checked:border-brand-teal transition-all">
                        <Users size={14} /> Cliente
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <AppButton type="button" onClick={() => setIsUserModalOpen(false)} variant="secondary" className="flex-1">Cancelar</AppButton>
                  <AppButton type="submit" disabled={isUserSubmitting} className="flex-1" icon={isUserSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}>
                    Criar Usuário
                  </AppButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm">
            <CheckCircle2 size={20} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
