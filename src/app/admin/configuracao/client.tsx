"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, Edit2, Loader2, X, Save, Box, Maximize2, AlertCircle, 
  History, ShieldCheck, Globe, UserPlus, UserCheck, UserX, Shield, Mail, Lock, Check, Calendar, Users, CheckCircle2,
  Settings, Key, Fingerprint, Activity, ArrowRight, LayoutGrid, List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// --- TIPAGEM ---

interface ModeloPallet {
  id: string; cliente_id: string; codigo: string; nome: string; medidas: string;
  preco_reforma: number; preco_remanufatura: number; preco_compra_ivani: number;
  preco_pallet_novo: number; ativo: boolean; observacao: string;
}

interface LogAcesso {
  id: string; usuario_id: string; email: string; tipo_usuario: string; area: string; created_at: string;
}

interface Usuario {
  id: string; nome: string; email: string; senha?: string; perfil: 'admin' | 'cliente';
  ativo: boolean; created_at: string; updated_at: string;
}

interface AdminConfiguracaoClientProps {
  initialModelos: ModeloPallet[];
  initialUsuarios: Usuario[];
  initialLogs: LogAcesso[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(v: string) {
  try { return new Date(v).toLocaleString('pt-BR'); } catch { return v; }
}

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminConfiguracaoClient({ initialModelos, initialUsuarios, initialLogs }: AdminConfiguracaoClientProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'modelos' | 'usuarios' | 'acessos'>('modelos');
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
      setLoading(true);
      // 1. Modelos
      const { data: mData, error: mError } = await supabase
        .from("modelos_pallets")
        .select("*")
        .eq("cliente_id", "pce")
        .order("codigo", { ascending: true });
      if (mError) throw mError;
      setModelos(mData || []);

      // 2. Usuários
      const { data: uData, error: uError } = await supabase
        .from("usuarios")
        .select("*")
        .order("nome", { ascending: true });
      if (uError) throw uError;
      setUsuarios(uData || []);

      // 3. Logs
      const { data: lData, error: lError } = await supabase
        .from("portal_acessos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (lError) throw lError;
      setLogs(lData || []);

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Falha ao sincronizar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const filteredModelos = modelos.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsuarios = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ACTIONS (LOGIC PRESERVED) ---

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
        const { error } = await supabase.from("modelos_pallets").update(modeloData).eq("id", editingModelo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("modelos_pallets").insert([modeloData]);
        if (error) throw error;
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
      const { error } = await supabase.from("modelos_pallets").update({ ativo: !modelo.ativo }).eq("id", modelo.id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert("Erro: " + err.message); }
  };

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

    if (!userData.nome || !userData.email || !userData.senha) return alert("Preencha todos os campos.");

    try {
      setIsUserSubmitting(true);
      const { error } = await supabase.from("usuarios").insert([userData]);
      if (error) throw error;
      setSuccessMessage("Usuário criado com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
      form.reset();
      setIsUserModalOpen(false);
      fetchData();
    } catch (err: any) { alert("Erro ao criar usuário: " + err.message); }
    finally { setIsUserSubmitting(false); }
  };

  const toggleUserStatus = async (usuario: Usuario) => {
    try {
      const { error } = await supabase.from("usuarios").update({ ativo: !usuario.ativo }).eq("id", usuario.id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert("Erro: " + err.message); }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-[var(--ivani-border)] relative">
        <div className="absolute bottom-[-1px] left-0 w-24 h-[2px] bg-[var(--ivani-primary)]" />
        <div className="relative">
          {/* Subtle Bic Pen Decoration */}
          <svg className="absolute -left-6 -top-6 w-12 h-12 text-[var(--ivani-primary)] opacity-40 pointer-events-none" viewBox="0 0 100 100">
             <path d="M5,50 Q45,5 95,50 T185,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
             <path d="M10,65 Q50,20 90,65 T170,65" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-primary)] mb-2 opacity-80">Administração</p>
          <h1 className="text-3xl font-black text-[var(--ivani-text)] tracking-tight">Configurações</h1>
          <p className="text-sm text-[var(--ivani-muted)] mt-2 font-medium max-w-lg leading-relaxed">
            Gestão de catálogos de pallets, controle de usuários e monitoramento de segurança do portal.
          </p>
        </div>
        
        {/* Tab Selector */}
        <div className="inline-flex p-1.5 bg-[var(--ivani-bg)]/60 rounded-2xl border border-[var(--ivani-border)]">
          {[
            { id: "modelos", label: "Modelos", icon: <Box size={16} /> },
            { id: "usuarios", label: "Usuários", icon: <Users size={16} /> },
            { id: "acessos", label: "Acessos", icon: <Fingerprint size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[var(--ivani-primary)] shadow-sm border border-[var(--ivani-border)]"
                  : "text-[var(--ivani-muted)] hover:text-[var(--ivani-text)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error/Loading ────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-3xl flex items-center gap-4">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm font-black text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <Loader2 className="text-[var(--ivani-primary)] animate-spin" size={40} />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ivani-muted)]">Sincronizando Sistema</p>
           </div>
        </div>
      )}

      {/* ── Tab Views ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'modelos' && (
          <motion.div key="mod" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)]" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome ou código..." 
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-[var(--ivani-border)] rounded-2xl text-[13px] font-bold text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-primary)] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <button 
                 onClick={() => { setEditingModelo(null); setIsModalOpen(true); }}
                 className="px-6 py-3.5 bg-[var(--ivani-primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:shadow-lg active:scale-95 transition-all"
               >
                 <Plus size={18} /> Novo Catálogo
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModelos.map((item, idx) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} whileHover={{ y: -5 }} className={`editorial-card flex flex-col ${!item.ativo ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <div className="p-6 pb-0 flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.ativo ? 'bg-[var(--ivani-bg)] text-[var(--ivani-primary)]' : 'bg-gray-100 text-gray-400'}`}>
                        <Box size={24} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-widest block">{item.codigo || "S/ COD"}</span>
                        <h3 className="text-base font-black text-[var(--ivani-text)] tracking-tight leading-tight">{item.nome}</h3>
                      </div>
                    </div>
                    <button onClick={() => { setEditingModelo(item); setIsModalOpen(true); }} className="p-2.5 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] rounded-xl transition-all">
                      <Edit2 size={16} />
                    </button>
                  </div>

                  <div className="px-6 mb-6">
                    <div className="flex items-center gap-2 text-[var(--ivani-muted)] text-[10px] font-black uppercase tracking-widest">
                       <Maximize2 size={14} className="opacity-40" />
                       {item.medidas || "Medidas não informadas"}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-6">
                       {[
                         { label: "Reforma", value: item.preco_reforma, color: "#DD5C36" },
                         { label: "Remanuf.", value: item.preco_remanufatura, color: "var(--ivani-teal)" },
                         { label: "Compra", value: item.preco_compra_ivani, color: "var(--ivani-blue)" },
                         { label: "Novo", value: item.preco_pallet_novo, color: "var(--ivani-primary)" }
                       ].map(p => (
                         <div key={p.label} className="p-3 bg-[var(--ivani-bg)]/40 rounded-xl border border-[var(--ivani-border)]">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: p.color }}>{p.label}</p>
                            <p className="text-xs font-black text-[var(--ivani-text)]">{fmtMoney(p.value)}</p>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="px-6 pb-6 mt-auto">
                    <button 
                      onClick={() => toggleStatusModelo(item)} 
                      className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${item.ativo ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {item.ativo ? "Desativar Catálogo" : "Ativar no Catálogo"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'usuarios' && (
          <motion.div key="usr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)]" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome ou e-mail..." 
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-[var(--ivani-border)] rounded-2xl text-[13px] font-bold text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-primary)] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <button 
                 onClick={() => setIsUserModalOpen(true)}
                 className="px-6 py-3.5 bg-[var(--ivani-primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:shadow-lg active:scale-95 transition-all"
               >
                 <UserPlus size={18} /> Criar Usuário
               </button>
            </div>

            <div className="editorial-card overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                        {["Usuário", "Identificação", "Nível", "Status", "Ações"].map(h => (
                          <th key={h} className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ivani-border)]">
                      {filteredUsuarios.map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--ivani-bg)]/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-[var(--ivani-primary)] text-white flex items-center justify-center font-black text-xs shadow-sm group-hover:scale-110 transition-transform uppercase">
                                 {u.nome.slice(0, 2)}
                               </div>
                               <span className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{u.nome}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-[var(--ivani-text)]">{u.email}</span>
                               <span className="text-[9px] font-bold text-[var(--ivani-muted)] uppercase opacity-60">Criado: {fmtDate(u.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${u.perfil === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {u.perfil === 'admin' ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                                {u.perfil}
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${u.ativo ? 'text-emerald-600' : 'text-red-500'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <button onClick={() => toggleUserStatus(u)} className={`p-2.5 rounded-xl transition-all ${u.ativo ? 'text-red-400 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>
                                {u.ativo ? <UserX size={18} /> : <UserCheck size={18} />}
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'acessos' && (
          <motion.div key="acc" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="editorial-card overflow-hidden">
               <div className="p-6 border-b border-[var(--ivani-border)] bg-[var(--ivani-bg)]/20 flex items-center justify-between">
                  <h3 className="text-sm font-black text-[var(--ivani-text)] uppercase tracking-widest">Logs de Auditoria (Últimos 100)</h3>
                  <button onClick={() => fetchData()} className="text-[var(--ivani-muted)] hover:text-[var(--ivani-primary)] transition-colors"><RefreshCcw size={16} /></button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--ivani-bg)]/40 border-b border-[var(--ivani-border)]">
                        {["Origem", "Nível", "Localização", "Registro"].map(h => (
                          <th key={h} className="px-6 py-5 text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ivani-border)]">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--ivani-bg)]/30 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white border border-[var(--ivani-border)] flex items-center justify-center text-[var(--ivani-muted)] group-hover:scale-110 transition-transform"><Key size={16} /></div>
                                <span className="text-xs font-black text-[var(--ivani-text)]">{log.email}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`text-[9px] font-black uppercase tracking-widest ${log.tipo_usuario === 'admin' ? 'text-indigo-600' : 'text-amber-600'}`}>{log.tipo_usuario}</span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--ivani-bg)] rounded-lg border border-[var(--ivani-border)]">
                                {log.area.includes('admin') ? <Shield size={12} className="text-[var(--ivani-primary)]" /> : <Globe size={12} className="text-[var(--ivani-teal)]" />}
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)]">{log.area}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-xs font-bold text-[var(--ivani-muted)]">
                                <Activity size={14} className="opacity-40" />
                                {fmtDate(log.created_at)}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modais (Redesigned) ────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[100] bg-[var(--ivani-text)]/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-[var(--ivani-border)] z-[110] overflow-hidden">
               <div className="h-2 bg-[var(--ivani-primary)]" />
               <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-primary)] hand-drawn-border"><Box size={24} /></div>
                     <h3 className="text-xl font-black text-[var(--ivani-text)] tracking-tight">{editingModelo ? "Editar Registro" : "Novo Catálogo"}</h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] rounded-2xl transition-all"><X size={20} /></button>
               </div>
               <form onSubmit={handleSubmitModelo} className="p-8 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1">Identificação Comercial</label><input name="nome" defaultValue={editingModelo?.nome} required className="w-full px-5 py-3.5 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-2xl text-sm font-bold text-[var(--ivani-text)] outline-none focus:bg-white focus:border-[var(--ivani-primary)] transition-all" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1">Código SKU</label><input name="codigo" defaultValue={editingModelo?.codigo} className="w-full px-5 py-3.5 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-2xl text-sm font-bold text-[var(--ivani-text)] outline-none focus:bg-white focus:border-[var(--ivani-primary)] transition-all" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1">Medidas Nominais (mm)</label><input name="medidas" defaultValue={editingModelo?.medidas} className="w-full px-5 py-3.5 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-2xl text-sm font-bold text-[var(--ivani-text)] outline-none focus:bg-white focus:border-[var(--ivani-primary)] transition-all" /></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "preco_reforma", label: "Reforma", color: "#DD5C36" },
                      { name: "preco_remanufatura", label: "Remanuf.", color: "var(--ivani-teal)" },
                      { name: "preco_compra_ivani", label: "Compra", color: "var(--ivani-blue)" },
                      { name: "preco_pallet_novo", label: "Novo", color: "var(--ivani-primary)" }
                    ].map(p => (
                      <div key={p.name} className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: p.color }}>{p.label}</label>
                        <input name={p.name} type="number" step="0.01" defaultValue={(editingModelo as any)?.[p.name]} className="w-full px-4 py-3 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-xl text-xs font-black text-[var(--ivani-text)] outline-none focus:bg-white transition-all" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1">Notas Internas</label><textarea name="observacao" defaultValue={editingModelo?.observacao} className="w-full px-5 py-4 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-2xl text-sm font-medium focus:bg-white focus:border-[var(--ivani-primary)] outline-none transition-all min-h-[100px] resize-none" /></div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-[var(--ivani-border)] text-[var(--ivani-muted)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--ivani-bg)] transition-all">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-[var(--ivani-primary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                       {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {isSubmitting ? "Gravando..." : "Salvar Catálogo"}
                    </button>
                  </div>
               </form>
            </motion.div>
          </>
        )}

        {isUserModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUserModalOpen(false)} className="fixed inset-0 z-[100] bg-[var(--ivani-text)]/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-[var(--ivani-border)] z-[110] overflow-hidden">
               <div className="h-2 bg-[var(--ivani-teal)]" />
               <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-3xl bg-[var(--ivani-bg)] flex items-center justify-center text-[var(--ivani-teal)] hand-drawn-border"><UserPlus size={24} /></div>
                     <h3 className="text-xl font-black text-[var(--ivani-text)] tracking-tight">Novo Acesso</h3>
                  </div>
                  <button onClick={() => setIsUserModalOpen(false)} className="p-3 text-[var(--ivani-muted)] hover:bg-[var(--ivani-bg)] rounded-2xl transition-all"><X size={20} /></button>
               </div>
               <form onSubmit={handleSubmitUsuario} className="p-8 pt-4 space-y-6">
                  <div className="space-y-4">
                    {[
                      { name: "nome", label: "Nome Completo", icon: <Users size={18} />, placeholder: "Ex: João Silva" },
                      { name: "email", label: "E-mail de Login", icon: <Mail size={18} />, placeholder: "usuario@email.com", type: "email" },
                      { name: "senha", label: "Senha de Acesso", icon: <Lock size={18} />, placeholder: "••••••••", type: "password" }
                    ].map(f => (
                      <div key={f.name} className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1">{f.label}</label>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] opacity-40">{f.icon}</div>
                           <input name={f.name} type={f.type || "text"} required placeholder={f.placeholder} className="w-full pl-12 pr-6 py-4 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-2xl text-sm font-bold text-[var(--ivani-text)] outline-none focus:bg-white focus:border-[var(--ivani-teal)] transition-all" />
                        </div>
                      </div>
                    ))}
                    
                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest ml-1">Nível de Privilégio</label>
                      <div className="grid grid-cols-2 gap-3">
                         {['admin', 'cliente'].map(p => (
                           <label key={p} className="cursor-pointer">
                              <input type="radio" name="perfil" value={p} defaultChecked={p === 'admin'} className="peer hidden" />
                              <div className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[var(--ivani-bg)]/50 border border-[var(--ivani-border)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--ivani-muted)] peer-checked:bg-[var(--ivani-primary)] peer-checked:text-white peer-checked:border-[var(--ivani-primary)] transition-all shadow-sm active:scale-95">
                                 {p === 'admin' ? <Shield size={14} /> : <Users size={14} />} {p}
                              </div>
                           </label>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 bg-white border border-[var(--ivani-border)] text-[var(--ivani-muted)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--ivani-bg)] transition-all">Cancelar</button>
                    <button type="submit" disabled={isUserSubmitting} className="flex-[2] py-4 bg-[var(--ivani-teal)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                       {isUserSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />} {isUserSubmitting ? "Criando..." : "Liberar Acesso"}
                    </button>
                  </div>
               </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-[var(--ivani-primary)] text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest">
            <CheckCircle2 size={20} className="text-[var(--ivani-secondary)]" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Icons for helper components (refresh/plus etc) ──
function RefreshCcw({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
