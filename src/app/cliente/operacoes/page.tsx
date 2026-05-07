import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import ClientOperacoes from "./client";

export const dynamic = "force-dynamic";

async function safeQuery(label: string, queryPromise: any) {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.error(`[Operacoes] ${label}:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }
    return JSON.parse(JSON.stringify(data || []));
  } catch (error) {
    console.error(`[Operacoes] ${label} exception:`, error);
    return [];
  }
}

export default async function CentralOperacoesPage() {
  const clienteId = "pce";
  let supabase: any = null;

  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[Operacoes] Failed to create admin client:", err);
  }

  let data: {
    coletas: any[],
    triagens: any[],
    estoque: any[],
    movimentacoes: any[],
    faturamentos: any[],
    modelos: any[]
  } = {
    coletas: [],
    triagens: [],
    estoque: [],
    movimentacoes: [],
    faturamentos: [],
    modelos: []
  };

  if (supabase) {
    try {
      const [
        coletas,
        triagens,
        estoque,
        movimentacoes,
        faturamentos,
        modelos
      ] = await Promise.all([
        safeQuery("coletas", supabase.from("coletas").select("id, cliente_id, data_coleta, quantidade_material_bruto, status, created_at").eq("cliente_id", clienteId).order("data_coleta", { ascending: false })),
        safeQuery("triagens", supabase.from("triagens").select("id, cliente_id, coleta_id, status, created_at").eq("cliente_id", clienteId)),
        safeQuery("estoque_pallets", supabase.from("estoque_pallets").select("id, cliente_id, quantidade_disponivel, updated_at").eq("cliente_id", clienteId)),
        safeQuery("movimentacoes", supabase.from("estoque_movimentacoes").select("id, cliente_id, tipo, quantidade, created_at").eq("cliente_id", clienteId).order("created_at", { ascending: false })),
        safeQuery("faturamentos", supabase.from("faturamentos").select("id, cliente_id, valor_total_estimado, created_at").eq("cliente_id", clienteId)),
        safeQuery("modelos", supabase.from("modelos_pallets").select("id, cliente_id, nome, codigo").eq("cliente_id", clienteId))
      ]);

      data = {
        coletas,
        triagens,
        estoque,
        movimentacoes,
        faturamentos,
        modelos
      };
    } catch (err) {
      console.error("Operacoes Server Global Error:", err);
    }
  }

  return <ClientOperacoes initialData={data} />;
}
