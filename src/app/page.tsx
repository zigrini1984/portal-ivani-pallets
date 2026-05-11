"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import Image from "next/image";
import { 
  Package, 
  Truck, 
  Recycle, 
  Search, 
  Wrench, 
  ClipboardCheck, 
  Leaf, 
  User, 
  ShieldCheck, 
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { login } from "@/app/actions/auth";

export default function Home() {
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handlePortalLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPortalLoading(true);
    setPortalError(null);

    const formData = new FormData();
    formData.set("email", portalEmail);
    formData.set("password", portalPassword);

    try {
      const result = await login(formData);

      if (result?.error) {
        setPortalError(result.error);
        setPortalLoading(false);
      } else if (result?.success && result?.redirectTo) {
        window.location.href = result.redirectTo;
      }
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente.");
      setPortalLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FDFDFC] text-[#1A3A6B] selection:bg-[#21409A]/10 relative overflow-hidden font-poppins">
      {/* Background Pattern: Architectural Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#1A3A6B 1px, transparent 1px), linear-gradient(90deg, #1A3A6B 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10 font-poppins">
        {/* Navigation / Header Area */}
        <header className="pt-12 pb-8 px-6 max-w-7xl mx-auto flex justify-between items-end border-b-2 border-dashed border-[#1A3A6B]/10">
          <div className="flex flex-col">
            <span className="text-4xl font-black tracking-tight text-[#21409A]">
              IVANI PALLETS
            </span>
            <span className="text-[10px] font-bold tracking-[0.3em] opacity-40 uppercase mt-1">Industrial & Sustainable Solutions</span>
          </div>
          <nav className="hidden md:flex gap-8 text-[11px] font-bold tracking-widest uppercase">
            <Link href="#sobre" className="hover:text-[#E3702D] transition-colors">Sobre Nós</Link>
            <Link href="#processo" className="hover:text-[#E3702D] transition-colors">Processo</Link>
            <Link href="#produtos" className="hover:text-[#E3702D] transition-colors">Produtos</Link>
            <Link href="#contato" className="hover:text-[#E3702D] transition-colors">Orçamento</Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="relative py-24 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Left Column */}
            <div className="flex flex-col">
              <h1 className="text-6xl md:text-7xl font-black mb-12 leading-[1.1] tracking-tight">
                <span className="block text-[#21409A]">REFORMAMOS.</span>
                <span className="block text-[#3AA54C]">REUTILIZAMOS.</span>
                <span className="block text-[#E3702D]">TRANSFORMAMOS</span>
                <span className="block text-[#E3702D]">O FUTURO.</span>
              </h1>

              <p className="text-xl text-[#1A3A6B]/70 mb-12 leading-relaxed max-w-md font-medium">
                Soluções em pallets usados para transporte eficiente, sustentável e responsável.
              </p>

              <Link href="#contato" className="w-fit">
                <button className="px-10 py-5 border-2 border-[#21409A] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] font-black text-lg hover:bg-[#21409A] hover:text-white transition-all transform hover:rotate-1 shadow-lg shadow-[#21409A]/5">
                  SOLICITE UM ORÇAMENTO
                </button>
              </Link>

              {/* Benefits Bar from JSON */}
              <div className="flex items-center gap-16 mt-20 pt-10 border-t-2 border-dashed border-[#1A3A6B]/10">
                {[
                  { icon: <Leaf size={32} />, label: "SUSTENTÁVEL" },
                  { icon: <Recycle size={32} />, label: "ECONÔMICO" },
                  { icon: <ShieldCheck size={32} />, label: "CONFIÁVEL" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 group">
                    <div className="text-[#21409A] opacity-40 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-500">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Portal & Illustration */}
            <div className="relative">
              {/* Hand-drawn frame */}
              <div className="absolute -inset-6 border-2 border-[#1A3A6B]/5 rounded-[50px_15px_60px_20px/20px_60px_15px_50px] -rotate-2 pointer-events-none" />
              
              <div className="bg-white p-12 rounded-[40px_20px_35px_25px/25px_35px_20px_40px] border-2 border-[#1A3A6B] relative shadow-2xl">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-black mb-2">PORTAL DO CLIENTE</h3>
                  <p className="text-[10px] font-bold opacity-40 tracking-widest uppercase">Acompanhe sua operação em tempo real</p>
                </div>

                <form onSubmit={handlePortalLogin} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black ml-1 uppercase tracking-tighter opacity-50">E-mail Corporativo</label>
                    <input
                      type="email"
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      className="w-full h-14 bg-[#FDFDFC] border-b-2 border-[#21409A] px-4 text-sm outline-none focus:border-[#E3702D] transition-colors font-bold"
                      placeholder="seu@email.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black ml-1 uppercase tracking-tighter opacity-50">Senha de Acesso</label>
                    <input
                      type="password"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      className="w-full h-14 bg-[#FDFDFC] border-b-2 border-[#21409A] px-4 text-sm outline-none focus:border-[#E3702D] transition-colors font-bold"
                      placeholder="••••••••"
                    />
                  </div>

                  {portalError && <p className="text-red-500 text-[11px] text-center font-black bg-red-50 py-2 rounded-lg">{portalError}</p>}

                  <button 
                    disabled={portalLoading}
                    className="w-full py-5 border-2 border-[#21409A] font-black hover:bg-[#21409A] hover:text-white transition-all active:translate-y-1 text-lg"
                  >
                    {portalLoading ? "AUTENTICANDO..." : "ENTRAR NO PORTAL"}
                  </button>
                </form>

                {/* Illustration Sketch Hint */}
                <div className="mt-12 flex flex-col items-center opacity-40 group hover:opacity-100 transition-opacity duration-700">
                  <div className="relative">
                    <Image 
                      src="/ivani_pallet_sketch_hero_1778296434259.png" 
                      alt="Esboço de Pallet" 
                      width={192}
                      height={192}
                      className="w-48 h-auto grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute -top-4 -right-4">
                      <Recycle size={60} strokeWidth={1} className="text-[#3AA54C] animate-spin-slow opacity-30" />
                    </div>
                  </div>
                  <span className="text-[8px] font-black mt-4 uppercase tracking-[0.5em] opacity-40">Operação Sustentável</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Sobre Nós */}
        <section id="sobre" className="py-32 px-6 bg-[#1A3A6B]/[0.02] border-y-2 border-[#1A3A6B]/5">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
            <div className="lg:w-1/2 p-8 border-2 border-[#1A3A6B] rounded-[20px_255px_20px_225px/225px_20px_255px_20px] bg-white relative group overflow-hidden">
               <div className="aspect-video bg-[#21409A]/5 flex flex-col items-center justify-center relative p-12">
                  <Image 
                    src="/ivani_truck_sketch_about_1778296454406.png" 
                    alt="Caminhão Logística" 
                    width={500}
                    height={300}
                    className="w-full h-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-[#1A3A6B]/10 rounded-xl pointer-events-none" />
               </div>
            </div>
            <div className="lg:w-1/2 space-y-10">
              <h2 className="text-5xl font-black">SOBRE NÓS</h2>
              <p className="text-xl leading-relaxed text-[#1A3A6B]/80 font-medium">
                A Ivani Pallets é especializada na reforma de pallets usados, oferecendo soluções inteligentes que reduzem custos, preservam recursos e movimentam o seu negócio.
              </p>
              <div className="grid grid-cols-1 gap-6 pt-4">
                {[
                  { label: "Atendimento personalizado", icon: <User size={20} /> },
                  { label: "Qualidade garantida", icon: <ShieldCheck size={20} /> },
                  { label: "Compromisso com a sustentabilidade", icon: <Leaf size={20} /> }
                ].map((pillar, i) => (
                  <div key={i} className="flex items-center gap-5 group">
                    <div className="w-12 h-12 border-2 border-[#1A3A6B]/10 rounded-xl flex items-center justify-center text-[#21409A] group-hover:border-[#21409A] group-hover:bg-[#21409A]/5 transition-all">
                      {pillar.icon}
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">{pillar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Nosso Processo */}
        <section id="processo" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-black mb-20 text-center uppercase tracking-tight">Nosso Processo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {/* Connection line hint */}
              <div className="hidden md:block absolute top-1/3 left-0 w-full h-[2px] border-b-2 border-dashed border-[#1A3A6B]/10 -z-10" />

              {[
                { n: 1, title: "COLETA", icon: <Truck />, desc: "Coletamos pallets usados no local do cliente." },
                { n: 2, title: "TRIAGEM", icon: <Search />, desc: "Avaliamos e separamos os pallets." },
                { n: 3, title: "REFORMA", icon: <Wrench />, desc: "Reformamos com padrões de qualidade e segurança." },
                { n: 4, title: "CONTROLE", icon: <ClipboardCheck />, desc: "Inspecionamos cada pallet antes da entrega." },
                { n: 5, title: "ENTREGA", icon: <Package />, desc: "Entregamos prontos para o uso no seu negócio." },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-8 bg-white border-2 border-[#1A3A6B]/10 rounded-3xl hover:border-[#21409A] transition-all group hover:shadow-xl hover:shadow-[#21409A]/5">
                  <div className="w-20 h-20 border-2 border-dashed border-[#1A3A6B]/20 rounded-2xl flex items-center justify-center text-[#21409A] mb-8 group-hover:rotate-6 transition-transform">
                    {React.cloneElement(step.icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 40, strokeWidth: 1 })}
                  </div>
                  <span className="text-2xl font-black text-[#E3702D] mb-2">{step.n}. {step.title}</span>
                  <p className="text-[11px] font-black leading-relaxed opacity-50 uppercase tracking-tighter">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Produtos */}
        <section id="produtos" className="py-32 px-6 bg-[#21409A]/[0.02] border-y-2 border-[#21409A]/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <h2 className="text-5xl font-black uppercase">Nossos Produtos</h2>
                <p className="text-lg opacity-60 font-medium mt-4 max-w-lg">Pallets reformados com qualidade e segurança para atender o que a sua operação precisa.</p>
              </div>
              <button className="px-8 py-4 border-2 border-[#1A3A6B] rounded-xl font-black text-xs tracking-widest hover:bg-[#1A3A6B] hover:text-white transition-all uppercase">
                Ver Todos os Modelos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { name: "Pallet PBR", spec: "Medidas padrão PBR." },
                { name: "Pallet 1200x1000", spec: "Resistente e versátil." },
                { name: "Pallet 1200x800", spec: "Ideal para exportação." },
                { name: "Pallet Sob Medida", spec: "Soluções personalizadas." },
              ].map((prod, i) => (
                <div key={i} className="bg-white p-6 border-2 border-[#1A3A6B]/10 rounded-[20px_50px_25px_40px/40px_25px_50px_20px] hover:border-[#21409A] transition-all group">
                  <div className="aspect-[4/3] bg-[#21409A]/5 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden p-6">
                     <Image 
                       src="/ivani_pallet_pbr_sketch_1778296492779.png" 
                       alt="Esboço de Pallet PBR" 
                       width={300}
                       height={200}
                       className="w-full h-auto object-contain opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                     />
                     <div className="absolute top-4 right-4 text-[8px] font-black opacity-20 tracking-widest">TECHNICAL SPEC V{i+1}</div>
                  </div>
                  <h4 className="text-2xl font-black mb-2">{prod.name}</h4>
                  <p className="text-xs font-black opacity-40 uppercase tracking-widest">{prod.spec}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Sustentabilidade */}
        <section className="py-40 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div className="relative flex justify-center">
                <div className="w-[400px] h-[400px] border-4 border-dashed border-[#3AA54C]/20 rounded-full animate-spin-slow flex items-center justify-center">
                   <Recycle size={300} strokeWidth={0.1} className="text-[#3AA54C]/10" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-20">
                   <Image 
                     src="/ivani_globe_sketch_sustainability_1778296473224.png" 
                     alt="Sustentabilidade Globo" 
                     width={400}
                     height={400}
                     className="w-full h-auto object-contain opacity-80 animate-pulse"
                   />
                </div>
             </div>
             <div className="space-y-10">
                <h2 className="text-6xl font-black leading-[1.1] text-[#3AA54C]">SUSTENTABILIDADE QUE MOVE O SEU NEGÓCIO</h2>
                <p className="text-2xl leading-relaxed opacity-70 font-medium">
                  Ao reutilizar, reduzimos o impacto ambiental e contribuímos para um futuro mais verde.
                </p>
                <button className="px-12 py-5 border-2 border-[#3AA54C] rounded-[255px_20px_225px_25px/25px_225px_20px_255px] font-black text-lg text-[#3AA54C] hover:bg-[#3AA54C] hover:text-white transition-all shadow-lg shadow-[#3AA54C]/10 uppercase">
                  Saiba Mais
                </button>
             </div>
          </div>
        </section>

        {/* Section: Contato / Footer */}
        <section id="contato" className="py-32 px-6 bg-[#FDFDFC]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32">
               <div>
                  <h3 className="text-5xl font-black mb-6 text-[#21409A]">VAMOS CONVERSAR?</h3>
                  <p className="text-xl font-medium opacity-60 mb-12">Solicite um orçamento e encontre a melhor solução para o seu negócio.</p>
                  
                  <div className="space-y-8 pt-8 border-t-2 border-dashed border-[#1A3A6B]/10">
                    {[
                      { label: "E-MAIL", val: "ranaldo@ivanipallets.com.br" },
                      { label: "SITE", val: "www.ivanipallets.com.br" },
                      { label: "INSTAGRAM", val: "@ivanipallets" }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-[10px] font-black opacity-30 tracking-[0.4em] uppercase">{item.label}</span>
                        <span className="text-2xl font-black text-[#1A3A6B]">{item.val}</span>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="p-2 border-2 border-[#1A3A6B] rounded-[45px_15px_55px_20px/20px_55px_15px_45px] shadow-2xl">
                 <div className="bg-white p-10 md:p-16 rounded-[43px_13px_53px_18px/18px_53px_13px_43px]">
                   <LeadForm />
                 </div>
               </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-12 pt-20 border-t-2 border-[#1A3A6B]/10">
               <div className="flex flex-col items-center md:items-start">
                  <span className="text-3xl font-black text-[#21409A]">IVANI PALLETS</span>
                  <p className="text-[10px] font-black tracking-[0.3em] opacity-30 mt-2">MAIS QUE PALLETS, CUIDAMOS DO QUE MOVE O SEU NEGÓCIO.</p>
               </div>
               <div className="flex items-center gap-4 text-[#3AA54C] opacity-40">
                  <span className="text-xs font-black uppercase tracking-widest">Sustentabilidade em cada detalhe</span>
                  <Leaf size={24} />
               </div>
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-[10px] font-black opacity-20 tracking-widest uppercase">© {new Date().getFullYear()} IVANI PALLETS — PROJETO ARQUITETÔNICO V2.0</p>
            </div>
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }
      ` }} />
    </main>
  );
}
