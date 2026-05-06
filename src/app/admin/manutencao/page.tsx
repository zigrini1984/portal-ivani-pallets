export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { AdminManutencaoClient } from "./client";

export default async function AdminManutencaoPage() {
  const supabase = createAdminClient();
  
  let manutData: any[] = [];
  let modelosData: any[] = [];
  let serverError: string | null = null;

  try {
    // 1. Buscar manutenções - Apenas colunas diretas para evitar quebra por relacionamentos
    const { data, error: manutError } = await supabase
      .from("manutencoes")
      .select(`
        id,
        triagem_id,
        coleta_id,
        cliente_id,
        modelo_id,
        modelo_nome_snapshot,
        tipo_servico,
        quantidade,
        status,
        data_entrada,
        data_inicio,
        data_conclusao,
        observacao,
        created_at,
        updated_at
      `)
      .eq("cliente_id", "pce")
      .order("created_at", { ascending: false });

    if (manutError) {
      console.error("[AdminManutencaoPage] Erro na query de manutenções:", manutError);
      serverError = manutError.message;
    } else {
      manutData = data || [];
    }

    // 2. Buscar modelos (Opcional, não deve travar a página)
    const { data: mData } = await supabase
      .from("modelos_pallets")
      .select("id, nome, codigo, medidas")
      .eq("ativo", true);
    
    modelosData = mData || [];

  } catch (err: any) {
    console.error("[AdminManutencaoPage] Erro crítico:", err.message);
    serverError = "Ocorreu um erro ao carregar os dados. Verifique a conexão com o banco.";
  }

  // Sempre retornar o componente, nunca dar throw
  return (
    <AdminManutencaoClient 
      initialManutencoes={manutData} 
      initialModelos={modelosData}
      serverError={serverError}
    />
  );
}
