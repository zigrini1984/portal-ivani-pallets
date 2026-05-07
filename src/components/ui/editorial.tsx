"use client";

import React from "react";
import { motion } from "framer-motion";
import { Leaf, Recycle, ShieldCheck, Zap } from "lucide-react";

interface BicPenBannerProps {
  title: string;
  subtitle: string;
  image: string;
  accentColor?: string;
}

export function BicPenBanner({ title, subtitle, image, accentColor = "var(--ivani-primary)" }: BicPenBannerProps) {
  return (
    <div className="relative w-full mb-8 overflow-hidden rounded-3xl bg-white border border-[var(--ivani-border)] shadow-sm group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none paper-texture" />
      
      <div className="flex flex-col md:flex-row items-center">
        <div className="flex-1 p-8 md:p-10 lg:pl-12 lg:pr-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-[1px] bg-[var(--ivani-primary)] opacity-40" />
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--ivani-primary)] opacity-60">
                Logística Inteligente
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--ivani-text)] tracking-tight leading-[1.1] mb-4">
              {title}
            </h2>
            <p className="text-sm md:text-base text-[var(--ivani-muted)] font-normal max-w-lg leading-relaxed opacity-80">
              {subtitle}
            </p>
            
            <div className="flex items-center gap-8 mt-6">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-primary)] opacity-50">Industrial Premium</span>
                  <div className="flex gap-2 text-[var(--ivani-primary)] opacity-70">
                     <Recycle size={15} strokeWidth={1.5} />
                     <Leaf size={15} strokeWidth={1.5} />
                     <ShieldCheck size={15} strokeWidth={1.5} />
                  </div>
               </div>
               <div className="w-[1px] h-10 bg-[var(--ivani-border)]" />
               <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--ivani-accent)] opacity-50">Sustentabilidade</span>
                  <div className="flex gap-2 text-[var(--ivani-accent)] opacity-70">
                     <Zap size={15} strokeWidth={1.5} />
                     <Leaf size={15} strokeWidth={1.5} />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full md:w-[45%] h-64 md:h-80 relative overflow-hidden bg-white flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full relative"
          >
            <img 
              src={image} 
              alt="Operational Sketch"
              className="w-full h-full object-contain opacity-100 group-hover:scale-[1.05] transition-transform duration-1000 p-2 bg-white"
              style={{ 
                filter: 'contrast(1.1) brightness(1.05) saturate(1.1)',
                mixBlendMode: 'multiply'
              }}
            />
          </motion.div>
          {/* Edge fade to blend with text area */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
        </div>
      </div>
      
      {/* Hand Drawn Corner Detail - Even more subtle */}
      <svg className="absolute top-6 right-6 w-16 h-16 text-[var(--ivani-primary)] opacity-10 pointer-events-none rotate-180" viewBox="0 0 100 100">
         <path d="M10,10 Q50,50 90,90" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
         <path d="M20,10 Q60,50 100,90" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--ivani-bg)]">
      <AdminSidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
