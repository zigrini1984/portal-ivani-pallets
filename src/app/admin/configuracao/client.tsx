"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, Edit2, Loader2, X, Save, Box, Maximize2, AlertCircle, 
  History, ShieldCheck, Globe, UserPlus, UserCheck, UserX, Shield, Mail, Lock, Check, Calendar, Users, CheckCircle2,
  Settings, Key, Fingerprint, Activity, ArrowRight, LayoutGrid, List, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  BicPenBanner, 
  PremiumCard, 
  PremiumButton, 
  PremiumModal, 
  PremiumBadge,
  PremiumInput
} from "@/components/ui/editorial";

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
      const { data: mData, error: mError } = await supabase
        .from("modelos_pallets")
        .select("id, cliente_id, codigo, nome, medidas, preco_reforma, preco_remanufatura, preco_compra_ivani, preco_pallet_novo, ativo, observacao")
        .eq("cliente_id", "pce")
        .order("codigo", { ascending: true });
      if (mError) throw mError;
      setModelos(mData || []);

      const { data: uData, error: uError } = await supabase
        .from("usuarios")
        .select("id, nome, email, perfil, ativo, created_at, updated_at")
        .order("nome", { ascending: true });
      if (uError) throw uError;
      setUsuarios(uData || []);

      const { data: lData, error: lError } = await supabase
        .from("portal_acessos")
        .select("id, usuario_id, email, tipo_usuario, area, created_at")
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
    <div className="max-w-[1200px] mx-auto pb-20">
      <BicPenBanner 
        title="Configurações do Sistema" 
        subtitle="Gerenciamento de usuários, modelos de pallets e logs de auditoria."
        image="/branding/banner-esg.png"
        hueRotate="120deg"
      />

      <div className="flex justify-end mb-12">
        <div className="inline-flex p-1.5 bg-[var(--ivani-bg)]/60 rounded-2xl border border-[var(--ivani-border)]/50 shadow-sm">
          {[
            { id: "modelos", label: "Modelos", icon: <Box size={16} /> },
            { id: "usuarios", label: "Usuários", icon: <Users size={16} /> },
            { id: "acessos", label: "Auditoria", icon: <Fingerprint size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[var(--ivani-text)] shadow-sm border border-[var(--ivani-border)]"
                  : "text-[var(--ivani-muted)] hover:text-[var(--ivani-text)] opacity-60"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-10">
            <PremiumCard className="p-5 bg-red-50 border-red-100 flex items-center gap-4">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm font-black text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={18} /></button>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[var(--ivani-text)]/20 backdrop-blur-md flex items-center justify-center"
          >
             <div className="flex flex-col items-center gap-6 p-12 bg-white rounded-[3rem] shadow-2xl border border-[var(--ivani-border)]">
                <Loader2 className="text-[var(--ivani-primary)] animate-spin" size={48} />
                <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--ivani-text)]">Sincronizando Sistema</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'modelos' && (
          <motion.div key="mod" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="relative w-full md:w-[450px] group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] group-focus-within:text-[var(--ivani-primary)] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome ou código..." 
                    className="w-full pl-14 pr-6 py-4 bg-white border-2 border-[var(--ivani-border)]/50 rounded-2xl text-[13px] font-bold text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-primary)]/40 transition-all shadow-sm placeholder:text-[var(--ivani-muted)]/40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <PremiumButton 
                 onClick={() => { setEditingModelo(null); setIsModalOpen(true); }}
                 icon={<Plus size={18} />}
               >
                 Adicionar ao Catálogo
               </PremiumButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredModelos.map((item, idx) => (
                <PremiumCard key={item.id} className={`group flex flex-col hover:border-[var(--ivani-primary)]/40 hover:shadow-xl transition-all duration-500 ${!item.ativo ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <div className="p-8 pb-0 flex justify-between items-start mb-10">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-500 ${item.ativo ? 'bg-[var(--ivani-bg)] text-[var(--ivani-primary)] border border-[var(--ivani-border)]/50' : 'bg-gray-100 text-gray-400'}`}>
                        <Box size={28} strokeWidth={1.5} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-[var(--ivani-muted)] uppercase tracking-[0.2em] block mb-1 opacity-50">{item.codigo || "S/ COD"}</span>
                        <h3 className="text-lg font-black text-[var(--ivani-text)] tracking-tighter leading-tight group-hover:text-[var(--ivani-primary)] transition-colors">{item.nome}</h3>
                      </div>
                    </div>
                    <PremiumButton
                      variant="secondary"
                      onClick={() => { setEditingModelo(item); setIsModalOpen(true); }}
                      icon={<Edit2 size={14} />}
                      className="!p-3 !rounded-xl !bg-white hover:!bg-[var(--ivani-bg)]"
                    />
                  </div>

                  <div className="px-8 mb-8">
                    <div className="flex items-center gap-3 text-[var(--ivani-muted)] text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                       <Maximize2 size={14} className="opacity-40" />
                       {item.medidas || "Dimensões não declaradas"}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-10">
                       {[
                         { label: "Oficina", value: item.preco_reforma, color: "#DD5C36" },
                         { label: "Remanuf.", value: item.preco_remanufatura, color: "var(--ivani-teal)" },
                         { label: "Aquisição", value: item.preco_compra_ivani, color: "var(--ivani-blue)" },
                         { label: "Item Novo", value: item.preco_pallet_novo, color: "var(--ivani-primary)" }
                       ].map(p => (
                         <div key={p.label} className="p-4 bg-[var(--ivani-bg)]/40 rounded-2xl border border-[var(--ivani-border)]/50 group-hover:bg-white transition-all duration-500 shadow-sm">
                            <p className="text-[8px] font-black uppercase tracking-widest mb-2 opacity-50" style={{ color: p.color }}>{p.label}</p>
                            <p className="text-sm font-black text-[var(--ivani-text)] tracking-tight">{fmtMoney(p.value)}</p>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="px-8 pb-8 mt-auto pt-4">
                    <PremiumButton 
                      variant="secondary"
                      onClick={() => toggleStatusModelo(item)} 
                      className={`w-full !text-[9px] !tracking-[0.2em] border-2 ${item.ativo ? 'border-red-50 text-red-500 hover:bg-red-50' : 'border-emerald-50 text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {item.ativo ? "Desativar em Catálogo" : "Habilitar para Operação"}
                    </PremiumButton>
                  </div>
                </PremiumCard>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'usuarios' && (
          <motion.div key="usr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="relative w-full md:w-[450px] group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] group-focus-within:text-[var(--ivani-primary)] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome ou e-mail..." 
                    className="w-full pl-14 pr-6 py-4 bg-white border-2 border-[var(--ivani-border)]/50 rounded-2xl text-[13px] font-bold text-[var(--ivani-text)] outline-none focus:border-[var(--ivani-primary)]/40 transition-all shadow-sm placeholder:text-[var(--ivani-muted)]/40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <PremiumButton 
                 onClick={() => setIsUserModalOpen(true)}
                 icon={<UserPlus size={18} />}
               >
                 Criar Novo Acesso
               </PremiumButton>
            </div>

            <PremiumCard className="overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="table-premium min-w-[900px]">
                    <thead>
                      <tr>
                        <th>Identificação</th>
                        <th>Credencial de Acesso</th>
                        <th>Nível de Privilégio</th>
                        <th>Estado de Segurança</th>
                        <th className="text-right">Gerenciamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsuarios.map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--ivani-bg)]/20 transition-colors group">
                          <td>
                            <div className="flex items-center gap-4">
                               <div className="w-11 h-11 rounded-2xl bg-[var(--ivani-primary)] text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform uppercase border-2 border-white/20">
                                 {u.nome.slice(0, 2)}
                               </div>
                               <span className="text-[15px] font-black text-[var(--ivani-text)] tracking-tight">{u.nome}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col">
                               <span className="text-[13px] font-bold text-[var(--ivani-text)] opacity-80">{u.email}</span>
                               <span className="text-[10px] font-black text-[var(--ivani-muted)] uppercase tracking-widest opacity-40 mt-1">Ativo desde {fmtDate(u.created_at).split(',')[0]}</span>
                            </div>
                          </td>
                          <td>
                             <PremiumBadge variant={u.perfil === 'admin' ? 'blue' : 'orange'}>
                                <div className="flex items-center gap-2">
                                   {u.perfil === 'admin' ? <ShieldCheck size={12} strokeWidth={3} /> : <UserCheck size={12} strokeWidth={3} />}
                                   <span className="tracking-widest">{u.perfil}</span>
                                </div>
                             </PremiumBadge>
                          </td>
                          <td>
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${u.ativo ? 'bg-emerald-500 shadow-[0_0_8px_var(--ivani-teal)] animate-pulse' : 'bg-red-400'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${u.ativo ? 'text-emerald-600' : 'text-red-500'}`}>{u.ativo ? 'Autenticado' : 'Bloqueado'}</span>
                             </div>
                          </td>
                          <td className="text-right">
                             <PremiumButton 
                               variant="secondary"
                               onClick={() => toggleUserStatus(u)}
                               icon={u.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                               className={`!p-3 !rounded-xl !bg-white border-2 ${u.ativo ? 'text-red-400 border-red-50 hover:bg-red-500 hover:text-white' : 'text-emerald-500 border-emerald-50 hover:bg-emerald-500 hover:text-white'}`}
                             />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </PremiumCard>
          </motion.div>
        )}

        {activeTab === 'acessos' && (
          <motion.div key="acc" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <PremiumCard className="overflow-hidden">
               <div className="p-8 border-b border-[var(--ivani-border)]/50 bg-[var(--ivani-bg)]/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--ivani-border)]/50 flex items-center justify-center text-[var(--ivani-primary)] shadow-sm">
                        <Fingerprint size={24} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-sm font-black text-[var(--ivani-text)] uppercase tracking-[0.2em]">Registro de Auditoria</h3>
                  </div>
                  <PremiumButton variant="secondary" onClick={() => fetchData()} className="!p-3 !rounded-xl">
                    <RefreshCcw size={16} />
                  </PremiumButton>
               </div>
               <div className="overflow-x-auto">
                  <table className="table-premium min-w-[800px]">
                    <thead>
                      <tr>
                        <th>Identidade Auditada</th>
                        <th>Nível</th>
                        <th>Localização</th>
                        <th>Carimbo de Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--ivani-bg)]/20 transition-colors group">
                          <td>
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white border border-[var(--ivani-border)]/50 flex items-center justify-center text-[var(--ivani-muted)] group-hover:scale-110 transition-transform shadow-sm"><Key size={18} strokeWidth={1.5} /></div>
                                <span className="text-[13px] font-black text-[var(--ivani-text)]">{log.email}</span>
                             </div>
                          </td>
                          <td>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${log.tipo_usuario === 'admin' ? 'text-indigo-600' : 'text-amber-600'}`}>{log.tipo_usuario}</span>
                          </td>
                          <td>
                             <PremiumBadge variant="default">
                                <div className="flex items-center gap-2">
                                  {log.area.includes('admin') ? <Shield size={12} className="text-[var(--ivani-primary)]" /> : <Globe size={12} className="text-[var(--ivani-teal)]" />}
                                  <span className="opacity-80">{log.area}</span>
                                </div>
                             </PremiumBadge>
                          </td>
                          <td>
                             <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--ivani-muted)]">
                                <Activity size={14} className="opacity-30" />
                                <span className="opacity-60">{fmtDate(log.created_at)}</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModelo ? "Editar Registro em Catálogo" : "Novo Registro de Catálogo"}
      >
         <form onSubmit={handleSubmitModelo} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="label-premium">Designação Comercial</label>
                <PremiumInput name="nome" defaultValue={editingModelo?.nome} required placeholder="Ex: Pallet PBR 01" />
              </div>
              <div className="space-y-3">
                <label className="label-premium">Código Identificador (SKU)</label>
                <PremiumInput name="codigo" defaultValue={editingModelo?.codigo} placeholder="Ex: IVN-PBR-01" />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="label-premium">Medidas Nominais (mm)</label>
              <PremiumInput name="medidas" defaultValue={editingModelo?.medidas} placeholder="Ex: 1000 x 1200 x 145" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "preco_reforma", label: "Oficina", color: "#DD5C36" },
                { name: "preco_remanufatura", label: "Remanuf.", color: "var(--ivani-teal)" },
                { name: "preco_compra_ivani", label: "Aquisição", color: "var(--ivani-blue)" },
                { name: "preco_pallet_novo", label: "Item Novo", color: "var(--ivani-primary)" }
              ].map(p => (
                <div key={p.name} className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60" style={{ color: p.color }}>{p.label}</label>
                  <input name={p.name} type="number" step="0.01" defaultValue={(editingModelo as any)?.[p.name]} className="w-full px-5 py-3.5 bg-[var(--ivani-bg)]/50 border-2 border-[var(--ivani-border)]/50 rounded-2xl text-sm font-black text-[var(--ivani-text)] outline-none focus:bg-white focus:border-current transition-all" />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <label className="label-premium">Especificações Técnicas / Observações</label>
              <textarea name="observacao" defaultValue={editingModelo?.observacao} className="input-premium min-h-[140px] py-5 resize-none" placeholder="Detalhes construtivos, tipos de madeira, etc..." />
            </div>

            <div className="flex gap-4 pt-6">
              <PremiumButton variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                Descartar
              </PremiumButton>
              <PremiumButton type="submit" loading={isSubmitting} icon={<Save size={18} />} className="flex-[2]">
                Salvar Catálogo
              </PremiumButton>
            </div>
         </form>
      </PremiumModal>

      <PremiumModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Controle de Acessos"
      >
         <form onSubmit={handleSubmitUsuario} className="space-y-8">
            <div className="space-y-6">
              {[
                { name: "nome", label: "Nome do Operador / Cliente", icon: <Users size={18} />, placeholder: "Ex: João Silva" },
                { name: "email", label: "E-mail de Login", icon: <Mail size={18} />, placeholder: "usuario@email.com", type: "email" },
                { name: "senha", label: "Senha Temporária", icon: <Lock size={18} />, placeholder: "••••••••", type: "password" }
              ].map(f => (
                <div key={f.name} className="space-y-3">
                  <label className="label-premium">{f.label}</label>
                  <div className="relative">
                     <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--ivani-muted)] opacity-30">{f.icon}</div>
                     <input name={f.name} type={f.type || "text"} required placeholder={f.placeholder} className="w-full pl-14 pr-6 py-4 bg-[var(--ivani-bg)]/50 border-2 border-[var(--ivani-border)]/50 rounded-[1.8rem] text-[15px] font-bold text-[var(--ivani-text)] outline-none focus:bg-white focus:border-[var(--ivani-teal)] transition-all placeholder:text-[var(--ivani-muted)]/30 shadow-sm" />
                  </div>
                </div>
              ))}
              
              <div className="space-y-4 pt-2">
                <label className="label-premium">Privilégios de Acesso</label>
                <div className="grid grid-cols-2 gap-4">
                   {['admin', 'cliente'].map(p => (
                     <label key={p} className="cursor-pointer group">
                        <input type="radio" name="perfil" value={p} defaultChecked={p === 'admin'} className="peer hidden" />
                        <div className="flex flex-col items-center justify-center gap-3 p-6 bg-[var(--ivani-bg)]/50 border-2 border-[var(--ivani-border)]/50 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-[var(--ivani-muted)] peer-checked:bg-[var(--ivani-primary)] peer-checked:text-white peer-checked:border-[var(--ivani-primary)] transition-all duration-500 shadow-sm hover:border-[var(--ivani-primary)]/30 active:scale-95 group-hover:shadow-md">
                           {p === 'admin' ? <Shield size={24} strokeWidth={1.5} /> : <Users size={24} strokeWidth={1.5} />} 
                           <span>{p}</span>
                        </div>
                     </label>
                   ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <PremiumButton variant="ghost" onClick={() => setIsUserModalOpen(false)} className="flex-1">
                Bloquear
              </PremiumButton>
              <PremiumButton type="submit" loading={isUserSubmitting} icon={<UserCheck size={20} />} className="flex-[2] bg-[var(--ivani-teal)] hover:bg-[var(--ivani-teal)]/90 shadow-teal-100">
                Habilitar Acesso
              </PremiumButton>
            </div>
         </form>
      </PremiumModal>

      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200]">
            <div className="bg-[var(--ivani-primary)] text-white px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black text-xs uppercase tracking-[0.2em] border border-white/20">
              <div className="w-8 h-8 rounded-full bg-[var(--ivani-secondary)] flex items-center justify-center text-[var(--ivani-primary)]">
                <Check size={18} strokeWidth={4} />
              </div>
              {successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
