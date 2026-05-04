"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Loader2,
  X,
  Save,
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
  Package,
  Settings,
  Users,
  Eye,
  History,
  ShieldCheck,
  Smartphone,
  Globe,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Lock,
  Check,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { LoadingScreen } from "@/components/ui/loading-screen";

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

const supabase = createClient();

export default function AdminConfiguracaoPage() {
  const [activeTab, setActiveTab] = useState<'modelos' | 'acessos' | 'usuarios'>('modelos');
  const [modelos, setModelos] = useState<ModeloPallet[]>([]);
  const [logs, setLogs] = useState<LogAcesso[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setError(null);
      
      // 1. Buscar Modelos
      const { data: mData, error: mError } = await supabase
        .from("modelos_pallets")
        .select("*")
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
                  <Settings className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Configurações</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Ivani Pallets — Admin</span>
                </div>
              </div>
            </div>

            <AdminNav />
            <div className="flex items-center gap-4">
               <button onClick={() => logout()} className="p-2 text-text-dark/40 hover:text-red-500 transition-colors" title="Sair"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Painel de Controle</h1>
          <p className="text-text-dark/50 text-sm mt-1">Gerencie modelos, usuários e monitore a atividade do portal.</p>
        </div>

        {/* Abas */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-1 rounded-2xl border border-brand-pink/10 w-fit shadow-sm">
          <button 
            onClick={() => setActiveTab('modelos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'modelos' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'text-text-dark/40 hover:bg-gray-50'}`}
          >
            <Box size={16} /> Modelos & Preços
          </button>
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'usuarios' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'text-text-dark/40 hover:bg-gray-50'}`}
          >
            <Users size={16} /> Gestão de Usuários
          </button>
          <button 
            onClick={() => setActiveTab('acessos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'acessos' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'text-text-dark/40 hover:bg-gray-50'}`}
          >
            <History size={16} /> Relatório de Acessos
          </button>
        </div>

        {loading ? (
          <LoadingScreen 
            message="Carregando Painel" 
            subMessage="Ivani Pallets — Configurações do Sistema"
          />
        ) : error ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-red-100">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
            <p className="text-sm font-medium text-text-dark/50">{error}</p>
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/30" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou código..." 
                      className="pl-10 pr-4 py-3 bg-white border border-brand-pink/20 rounded-xl text-xs font-medium w-full outline-none focus:ring-2 focus:ring-brand-cyan/10 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => { setEditingModelo(null); setIsModalOpen(true); }}
                    className="px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Novo Modelo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredModelos.map((item) => (
                    <div key={item.id} className={`bg-white rounded-3xl border ${item.ativo ? 'border-brand-pink/20' : 'border-gray-200 opacity-60'} p-6 card-shadow relative overflow-hidden`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${item.ativo ? 'bg-brand-cyan/5 text-brand-cyan' : 'bg-gray-50 text-gray-400'} rounded-xl flex items-center justify-center`}><Box size={20} /></div>
                          <div>
                            <span className="text-[10px] font-bold text-text-dark/40 uppercase tracking-widest block">{item.codigo || "S/ COD"}</span>
                            <h3 className="text-sm font-bold text-text-dark">{item.nome}</h3>
                          </div>
                        </div>
                        <button onClick={() => { setEditingModelo(item); setIsModalOpen(true); }} className="p-2 text-text-dark/20 hover:text-brand-cyan transition-colors"><Edit2 size={16} /></button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-text-dark/50 text-[11px] font-bold"><Maximize2 size={14} /> {item.medidas || "Medidas N/A"}</div>
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
                        <button onClick={() => toggleStatusModelo(item)} className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${item.ativo ? 'border-red-100 text-red-400 hover:bg-red-50' : 'border-green-100 text-green-500 hover:bg-green-50'}`}>
                          {item.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </div>
                  ))}
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/30" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar usuário por nome ou email..." 
                      className="pl-10 pr-4 py-3 bg-white border border-brand-pink/20 rounded-xl text-xs font-medium w-full outline-none focus:ring-2 focus:ring-brand-cyan/10 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all flex items-center gap-2"
                  >
                    <UserPlus size={18} /> Novo Usuário
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-bg-primary">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Usuário</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">E-mail</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Perfil</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Criado em</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-pink/5">
                        {filteredUsuarios.map((u) => (
                          <tr key={u.id} className="hover:bg-bg-primary/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-brand-cyan/5 text-brand-cyan rounded-xl flex items-center justify-center font-bold text-xs uppercase">
                                  {u.nome.charAt(0)}
                                </div>
                                <div className="text-xs font-bold text-text-dark">{u.nome}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-text-dark/60 font-medium">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${u.perfil === 'admin' ? 'bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {u.perfil}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-tight ${u.ativo ? 'text-green-600' : 'text-red-400'}`}>
                                  {u.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[10px] text-text-dark/40 font-bold uppercase">
                              {new Date(u.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <button 
                                  onClick={() => toggleUserStatus(u)}
                                  className={`p-2 rounded-xl transition-all ${u.ativo ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                  title={u.ativo ? "Desativar" : "Ativar"}
                                >
                                  {u.ativo ? <UserX size={18} /> : <UserCheck size={18} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredUsuarios.length === 0 && (
                    <div className="py-20 text-center">
                      <Users className="mx-auto text-text-dark/10 mb-4" size={48} />
                      <p className="text-text-dark/50 text-sm font-medium">Nenhum usuário encontrado.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'acessos' && (
              <motion.div 
                key="acessos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-brand-pink/20 overflow-hidden shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg-primary">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Usuário</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Tipo</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Área</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-dark/40">Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-pink/5">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-bg-primary/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-text-dark/40"><Users size={14} /></div>
                              <div>
                                <div className="text-xs font-bold text-text-dark">{log.email}</div>
                                <div className="text-[10px] text-text-dark/30 font-medium">ID: {log.usuario_id?.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${log.tipo_usuario === 'admin' ? 'bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {log.tipo_usuario}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-text-dark/50 text-[10px] font-bold uppercase tracking-tight">
                              {log.area.includes('admin') ? <ShieldCheck size={12} className="text-brand-cyan" /> : <Globe size={12} className="text-amber-500" />}
                              {log.area}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-text-dark/60">{new Date(log.created_at).toLocaleString('pt-BR')}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logs.length === 0 && (
                  <div className="py-20 text-center">
                    <History className="mx-auto text-text-dark/10 mb-4" size={48} />
                    <p className="text-text-dark/50 text-sm font-medium">Nenhum registro de acesso encontrado.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Modal Modelos */}
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
              <form onSubmit={handleSubmitModelo} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Nome do Modelo</label><input name="nome" defaultValue={editingModelo?.nome} required className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Código Interno</label><input name="codigo" defaultValue={editingModelo?.codigo} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Medidas (mm)</label><input name="medidas" defaultValue={editingModelo?.medidas} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Reforma</label><input name="preco_reforma" type="number" step="0.01" defaultValue={editingModelo?.preco_reforma} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Remanuf.</label><input name="preco_remanufatura" type="number" step="0.01" defaultValue={editingModelo?.preco_remanufatura} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Compra</label><input name="preco_compra_ivani" type="number" step="0.01" defaultValue={editingModelo?.preco_compra_ivani} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-tighter text-text-dark/40 ml-1">Novo</label><input name="preco_pallet_novo" type="number" step="0.01" defaultValue={editingModelo?.preco_pallet_novo} className="w-full px-3 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Observações</label><textarea name="observacao" defaultValue={editingModelo?.observacao} className="w-full px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm outline-none min-h-[80px] resize-none" /></div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-text-dark/60 hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg hover:bg-[#1a6e74] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar</button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUserModalOpen(false)} className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden" >
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan"><UserPlus size={20} /></div>
                  <h3 className="font-bold text-lg">Novo Usuário</h3>
                </div>
                <button onClick={() => setIsUserModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmitUsuario} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Nome Completo</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/20" size={16} />
                    <input name="nome" type="text" required placeholder="Ex: João Silva" className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/10 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/20" size={16} />
                    <input name="email" type="email" required placeholder="usuario@email.com" className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/10 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Senha Provisória</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/20" size={16} />
                    <input name="senha" type="password" required placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-cyan/10 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40 ml-1">Perfil de Acesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="cursor-pointer">
                      <input type="radio" name="perfil" value="admin" defaultChecked className="peer hidden" />
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-xs font-bold text-text-dark/40 peer-checked:bg-brand-cyan peer-checked:text-white peer-checked:border-brand-cyan transition-all">
                        <Shield size={14} /> Admin
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input type="radio" name="perfil" value="cliente" className="peer hidden" />
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-primary border border-brand-pink/20 rounded-xl text-xs font-bold text-text-dark/40 peer-checked:bg-brand-cyan peer-checked:text-white peer-checked:border-brand-cyan transition-all">
                        <Users size={14} /> Cliente
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-text-dark/60 hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isUserSubmitting} className="flex-1 px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg hover:bg-[#1a6e74] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                    {isUserSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
                    Criar Usuário
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm">
            <CheckCircle2 size={20} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
