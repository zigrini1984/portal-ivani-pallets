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
    <div className="relative w-full mb-10 overflow-hidden rounded-[2.5rem] bg-white border border-[var(--ivani-border)] shadow-sm group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none paper-texture" />
      
      <div className="flex flex-col md:flex-row items-center">
        <div className="flex-1 p-8 md:p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-[1px] bg-[var(--ivani-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--ivani-primary)] opacity-80">
                Editorial Industrial
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--ivani-text)] tracking-tighter leading-[0.95] mb-6">
              {title}
            </h2>
            <p className="text-base text-[var(--ivani-muted)] font-medium max-w-md leading-relaxed">
              {subtitle}
            </p>
            
            <div className="flex items-center gap-6 mt-8">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-primary)]">Sustentabilidade</span>
                  <div className="flex gap-1.5 text-[var(--ivani-primary)]">
                     <Recycle size={14} />
                     <Leaf size={14} />
                     <ShieldCheck size={14} />
                  </div>
               </div>
               <div className="w-[1px] h-8 bg-[var(--ivani-border)]" />
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ivani-muted)]">Performance</span>
                  <div className="flex gap-1.5 text-[var(--ivani-muted)] opacity-40">
                     <Zap size={14} />
                     <ShieldCheck size={14} />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden bg-[var(--ivani-bg)]/30 border-l border-[var(--ivani-border)]">
          <motion.img 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            src={image} 
            alt="Operational Sketch"
            className="w-full h-full object-cover grayscale-[0.2] mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-1000"
          />
          {/* Bic Pen Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent hidden md:block" />
        </div>
      </div>
      
      {/* Hand Drawn Corner Detail */}
      <svg className="absolute bottom-4 right-4 w-12 h-12 text-[var(--ivani-primary)] opacity-20 pointer-events-none" viewBox="0 0 100 100">
         <path d="M20,80 Q50,50 80,20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
         <path d="M30,90 Q60,60 90,30" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
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
