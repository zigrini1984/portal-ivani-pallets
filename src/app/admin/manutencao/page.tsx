export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { AdminManutencaoClient } from "./client";

export default async function AdminManutencaoPage() {
  const supabase = createAdminClient();

  // 1. Buscar manutenções com dados relacionados
  const { data: manutData, error: manutError } = await supabase
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
      created_at
    `)
    .eq("cliente_id", "pce")
    .order("created_at", { ascending: false });

  if (manutError) {
    console.error("[AdminManutencaoPage] Erro ao buscar manutenções:", manutError.message);
  }

  // 2. Buscar modelos para filtros/apoio
  const { data: modelosData } = await supabase
    .from("modelos_pallets")
    .select("id, nome, codigo, medidas")
    .eq("ativo", true);

  return (
    <AdminManutencaoClient 
      initialManutencoes={manutData || []} 
      initialModelos={modelosData || []}
      serverError={manutError ? manutError.message : null}
    />
  );
}
