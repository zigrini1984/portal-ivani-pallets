"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  X,
  Save,
  Trash2,
  ChevronRight,
  LayoutDashboard,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TIPAGEM ---

interface Lote {
  id: string;
  numero_lote: string;
  data_entrada: string;
  quantidade: number;
  status: string;
  destino: string;
  prioridade?: string;
  observacao: string;
}

interface LoteEvento {
  id: string;
  lote_id: string;
  etapa: string;
  descricao: string;
  created_at: string;
}

const STATUS_OPTIONS = ["triagem", "manutencao", "remanufatura", "descarte", "compra", "finalizado"];
const DESTINO_OPTIONS = ["A definir", "manutencao", "remanufatura", "descarte", "compra"];

// --- COMPONENTES DE UI ---

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) => {
  const styles: Record<string, string> = {
    triagem: "bg-blue-50 text-blue-600 border-blue-100",
    manutencao: "bg-amber-50 text-amber-600 border-amber-100",
    remanufatura: "bg-purple-50 text-purple-600 border-purple-100",
    descarte: "bg-red-50 text-red-600 border-red-100",
    compra: "bg-green-50 text-green-600 border-green-100",
    finalizado: "bg-brand-cyan/5 text-brand-cyan border-brand-cyan/10",
    default: "bg-gray-100 text-gray-600 border-gray-200"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
};

export default function AdminLotesPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // --- BUSCA DE DADOS ---

  const fetchLotes = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Configuração do Supabase não encontrada.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${supabaseUrl}/rest/v1/lotes?order=data_entrada.desc`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) throw new Error("Falha ao buscar lotes");
      const data = await response.json();
      setLotes(data);
    } catch (err) {
      setError("Erro ao carregar lotes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  // --- AÇÕES ---

  const handleSaveLote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseAnonKey) return;

    const formData = new FormData(e.currentTarget);
    const loteData = {
      numero_lote: formData.get("numero_lote") as string,
      data_entrada: formData.get("data_entrada") as string || new Date().toISOString(),
      quantidade: parseInt(formData.get("quantidade") as string || "0"),
      status: formData.get("status") as string,
      destino: formData.get("destino") as string,
      observacao: formData.get("observacao") as string,
    };

    try {
      setIsSubmitting(true);
      
      let response;
      if (editingLote) {
        // Atualizar
        response = await fetch(`${supabaseUrl}/rest/v1/lotes?id=eq.${editingLote.id}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(loteData),
        });

        // Se o status mudou, criar evento
        if (editingLote.status !== loteData.status) {
          await fetch(`${supabaseUrl}/rest/v1/lote_eventos`, {
            method: "POST",
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lote_id: editingLote.id,
              etapa: loteData.status,
              descricao: `Status atualizado para ${loteData.status} pela administração.`
            }),
          });
        }
      } else {
        // Criar
        response = await fetch(`${supabaseUrl}/rest/v1/lotes`, {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(loteData),
        });

        const createdLotes = await response.json();
        if (createdLotes.length > 0) {
          // Criar evento inicial
          await fetch(`${supabaseUrl}/rest/v1/lote_eventos`, {
            method: "POST",
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lote_id: createdLotes[0].id,
              etapa: "recebido",
              descricao: "Lote cadastrado no sistema Ivani Pallets."
            }),
          });
        }
      }

      if (!response.ok) throw new Error("Falha ao salvar lote");

      setIsModalOpen(false);
      setEditingLote(null);
      fetchLotes();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o lote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (lote: Lote) => {
    setEditingLote(lote);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingLote(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-dark pb-20">
      {/* Header Admin */}
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.location.href = "/"}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={18} className="text-text-dark/40" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center">
                  <Package className="text-white" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none text-brand-cyan">Gestão de Lotes</span>
                  <span className="text-[10px] font-bold text-text-dark/30 uppercase tracking-tighter mt-0.5">Admin Ivani Pallets</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all flex items-center gap-2"
               >
                 <Plus size={16} />
                 Novo Lote
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel de Lotes (PCE)</h1>
            <p className="text-text-dark/50 text-sm mt-1">Gerencie a triagem, manutenção e destino dos lotes do cliente PCE.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-cyan" size={32} />
            <p className="text-xs font-bold text-text-dark/30 uppercase tracking-widest">Buscando lotes...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
            <p className="text-sm font-medium text-text-dark/50">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-brand-pink/20 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg-primary/50 text-[10px] font-bold uppercase tracking-widest text-text-dark/40 border-b border-brand-pink/10">
                    <th className="px-6 py-4">Lote</th>
                    <th className="px-6 py-4">Qtd</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Destino</th>
                    <th className="px-6 py-4">Entrada</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pink/10">
                  {lotes.map((lote) => (
                    <tr key={lote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-xs">{lote.numero_lote}</div>
                        <div className="text-[10px] text-text-dark/30 truncate max-w-[200px]">{lote.observacao || "Sem observação"}</div>
                      </td>
                      <td className="px-6 py-5 font-bold text-brand-cyan text-xs">{lote.quantidade}</td>
                      <td className="px-6 py-5"><Badge variant={lote.status}>{lote.status}</Badge></td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-bold text-text-dark/60 uppercase">{lote.destino}</span>
                      </td>
                      <td className="px-6 py-5 text-[10px] font-medium text-text-dark/40">
                        {new Date(lote.data_entrada).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleOpenEdit(lote)}
                          className="p-2 text-text-dark/40 hover:text-brand-cyan hover:bg-brand-cyan/5 rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Criação/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-text-dark/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-brand-pink/20 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-brand-pink/10 flex justify-between items-center">
                <h3 className="font-bold text-lg">{editingLote ? "Editar Lote" : "Novo Lote"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-text-dark/30 hover:text-text-dark transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveLote} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40">Número do Lote</label>
                    <input 
                      name="numero_lote"
                      defaultValue={editingLote?.numero_lote}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none"
                      placeholder="LOTE-2024-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40">Quantidade</label>
                    <input 
                      name="quantidade"
                      type="number"
                      defaultValue={editingLote?.quantidade}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40">Status</label>
                    <select 
                      name="status"
                      defaultValue={editingLote?.status || "triagem"}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none appearance-none"
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40">Destino</label>
                    <select 
                      name="destino"
                      defaultValue={editingLote?.destino || "A definir"}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none appearance-none"
                    >
                      {DESTINO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-dark/40">Observação</label>
                  <textarea 
                    name="observacao"
                    defaultValue={editingLote?.observacao}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all outline-none min-h-[100px] resize-none"
                    placeholder="Detalhes sobre a triagem ou manutenção..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-brand-cyan text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-cyan/20 hover:bg-[#1a6e74] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {editingLote ? "Salvar Alterações" : "Cadastrar Lote"}
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
