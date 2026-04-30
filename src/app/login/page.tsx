"use client";

import { motion } from "framer-motion";
import { Package, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    try {
      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-dark font-sans flex items-center justify-center px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md pointer-events-auto"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-brand-cyan font-bold mb-8 hover:gap-3 transition-all">
          <ArrowLeft size={20} /> Voltar para o início
        </Link>

        <div className="relative z-10 bg-white p-10 rounded-[3rem] card-shadow border border-brand-pink pointer-events-auto">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-brand-cyan rounded-2xl flex items-center justify-center shadow-lg shadow-brand-cyan/20">
              <Package className="text-white" size={32} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-bold mb-2">Portal do Cliente</h1>
            <p className="text-sm text-text-dark/50">Entre com suas credenciais para acessar sua área</p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-20 space-y-6 pointer-events-auto">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">E-mail</label>
              <input 
                name="email"
                type="email" 
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                placeholder="seu@email.com.br"
                autoComplete="email"
                className="w-full h-14 bg-bg-primary border border-brand-pink rounded-2xl px-5 focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-dark/40 mb-2 ml-1">Senha</label>
              <input 
                name="password"
                type="password" 
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                placeholder="Sua senha"
                autoComplete="current-password"
                className="w-full h-14 bg-bg-primary border border-brand-pink rounded-2xl px-5 focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-3 rounded-xl border border-red-100">
                {error === "Invalid login credentials" ? "E-mail ou senha incorretos" : error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 bg-brand-cyan hover:bg-[#1a6e74] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-cyan/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Entrar no Portal <ArrowRight size={20} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-text-dark/40">
              Esqueceu sua senha ou não tem acesso? <br />
              Entre em contato com o suporte da Ivani Pallets.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dark/20">
            Ivani Pallets — Gestão de Ativos Industriais
          </p>
        </div>
      </motion.div>
    </main>
  );
}
