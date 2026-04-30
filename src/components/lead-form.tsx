"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { submitLeadAction } from "@/app/actions/leads";

export function LeadForm() {
  const [state, formAction, isPending] = useActionState(submitLeadAction, null);

  return (
    <form 
      action={formAction}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {state && (
        <div className={`md:col-span-2 rounded-xl px-4 py-3 text-sm font-semibold ${state.success ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {state.success ? state.message : state.error}
        </div>
      )}
      <div className="md:col-span-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Nome</label>
        <input required name="nome" type="text" placeholder="Nome completo" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
      </div>
      <div className="md:col-span-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Empresa</label>
        <input required name="empresa" type="text" placeholder="Nome da empresa" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
      </div>
      <div className="md:col-span-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">WhatsApp</label>
        <input required name="whatsapp" type="tel" placeholder="WhatsApp com DDD" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
      </div>
      <div className="md:col-span-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">E-mail</label>
        <input required name="email" type="email" placeholder="email@empresa.com.br" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Cidade</label>
        <input required name="cidade" type="text" placeholder="Cidade / Estado" className="w-full h-12 bg-bg-primary border border-brand-pink/30 rounded-xl px-4 focus:outline-none focus:border-brand-cyan/50 transition-colors" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Mensagem</label>
        <textarea name="mensagem" rows={3} placeholder="Escreva brevemente como podemos ajudar" className="w-full bg-bg-primary border border-brand-pink/30 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-cyan/50 transition-colors resize-none"></textarea>
      </div>
      
      <div className="md:col-span-2 mt-4">
        <motion.button
          disabled={isPending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-5 text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-cyan/20 ${isPending ? "bg-brand-cyan/50 cursor-not-allowed" : "bg-brand-cyan hover:bg-[#1a6e74]"}`}
        >
          {isPending ? "Enviando..." : "Solicitar contato agora"}
        </motion.button>
      </div>
    </form>
  );
}
