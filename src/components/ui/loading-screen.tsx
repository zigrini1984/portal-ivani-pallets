"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, Package } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export function LoadingScreen({ 
  message = "Sincronizando Dados...", 
  subMessage = "Ivani Pallets — Operação Conectada" 
}: LoadingScreenProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="relative mb-8"
      >
        <div className="w-20 h-20 bg-brand-cyan/10 rounded-[2rem] flex items-center justify-center text-brand-cyan shadow-xl shadow-brand-cyan/5">
          <Package size={40} />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg border border-brand-pink/10">
          <Loader2 className="animate-spin text-brand-cyan" size={20} />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-black text-text-dark uppercase tracking-[0.2em] mb-2">
          {message}
        </h3>
        <p className="text-[10px] font-bold text-text-dark/30 uppercase tracking-widest">
          {subMessage}
        </p>
      </motion.div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <LoadingScreen />
    </div>
  );
}
