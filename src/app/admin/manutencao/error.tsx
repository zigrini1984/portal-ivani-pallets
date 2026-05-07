"use client";

import React from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ManutencaoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-10">
      <div className="mx-auto max-w-xl w-full rounded-3xl border border-red-100 bg-white p-10 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
          <AlertCircle size={32} />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-2">
          Erro de Runtime
        </p>

        <h1 className="text-2xl font-black text-slate-900 leading-tight">
          Não foi possível carregar o painel de manutenção
        </h1>

        <p className="mt-4 text-sm text-slate-500 leading-relaxed">
          Ocorreu um erro inesperado ao processar esta página. Isso pode ser causado por uma falha na conexão ou estrutura de dados temporária.
        </p>

        <div className="mt-8 p-4 rounded-2xl bg-red-50/50 border border-red-100 text-left">
          <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1">Detalhes do Erro:</p>
          <pre className="text-[11px] text-red-700 whitespace-pre-wrap break-all font-mono">
            {error?.message || "Erro desconhecido"}
          </pre>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-6 py-4 text-sm font-bold text-white shadow-lg hover:bg-teal-800 transition-all active:scale-95"
          >
            <RotateCcw size={16} /> Tentar novamente
          </button>
          
          <Link
            href="/admin"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-4 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
          >
            <Home size={16} /> Voltar ao Início
          </Link>
        </div>
        
        <p className="mt-8 text-[10px] text-slate-400 font-medium">
          Se o problema persistir, entre em contato com o suporte técnico.
        </p>
      </div>
    </main>
  );
}


