"use client";

import { motion } from "framer-motion";
import { Package, ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full h-16 bg-[#DD5C36] hover:bg-[#E04F00] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#DD5C36]/20 disabled:opacity-70 disabled:cursor-not-allowed group"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <>
          Entrar no Portal 
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </>
      )}
    </motion.button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(
    async (_: any, formData: FormData) => {
      const result = await login(formData);
      if (result.success && result.redirectTo) {
        window.location.href = result.redirectTo;
      }
      return result;
    },
    null
  );

  return (
    <main className="min-h-screen bg-[#F8EDD9]/50 text-[#133020] font-sans flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#327039]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#DD5C36]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-[#327039] font-bold mb-8 group hover:gap-3 transition-all">
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" /> 
          <span className="text-sm">Voltar para o início</span>
        </Link>

        <div className="bg-white p-10 rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(22,35,42,0.05)] border border-[#133020]/5">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#133020] rounded-2xl flex items-center justify-center shadow-lg shadow-[#133020]/20">
              <Package className="text-white" size={32} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Portal do Cliente</h1>
            <p className="text-sm text-[#133020]/50">Acesse sua área exclusiva Ivani Pallets</p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#133020]/40 ml-1">E-mail Corporativo</label>
              <input 
                name="email"
                type="email" 
                required
                placeholder="exemplo@empresa.com"
                className="w-full h-14 bg-[#F8EDD9]/30 border border-transparent focus:border-[#327039]/30 rounded-2xl px-5 text-sm outline-none transition-all focus:bg-white focus:shadow-sm disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#133020]/40 ml-1">Senha de Acesso</label>
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                className="w-full h-14 bg-[#F8EDD9]/30 border border-transparent focus:border-[#327039]/30 rounded-2xl px-5 text-sm outline-none transition-all focus:bg-white focus:shadow-sm disabled:opacity-60"
              />
            </div>

            {state?.error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 text-red-600 text-xs font-semibold bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{state.error}</span>
              </motion.div>
            )}

            <SubmitButton />
          </form>

          <div className="mt-8 text-center pt-6 border-t border-[#133020]/5">
            <p className="text-[11px] text-[#133020]/40 leading-relaxed">
              Esqueceu sua senha ou não tem acesso? <br />
              Entre em contato com o suporte em <span className="text-[#DD5C36] font-bold hover:underline cursor-pointer">contato@ivanipallets.com.br</span>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#133020]/20">
            Logistics Intelligence System
          </p>
        </div>
      </motion.div>
    </main>
  );
}



