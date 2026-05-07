export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { AdminEstoqueClient } from "./client";

export default async function AdminEstoquePage() {
  try {
    const supabase = createAdminClient();
    const clienteId = "pce";

    // 1. Busca EXPLÍCITA do estoque acumulado
    const { data: estData, error: estError } = await supabase
      .from("estoque_pallets")
      .select(`
        id,
        cliente_id,
        modelo_id,
        modelo_pallet_id,
        modelo_nome_snapshot,
        quantidade,
        quantidade_disponivel,
        created_at,
        updated_at,
        modelo_pallet:modelos_pallets(nome, codigo, medidas)
      `)
      .eq("cliente_id", clienteId)
      .order("quantidade", { ascending: false });

    if (estError) throw estError;

    // 2. Busca das últimas movimentações
    const { data: movData, error: movError } = await supabase
      .from("estoque_movimentacoes")
      .select(`
        id,
        tipo,
        quantidade,
        origem,
        descricao,
        created_at,
        modelo_pallet:modelos_pallets(nome)
      `)
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (movError) throw movError;

    const mappedEstoque = (estData || []).map((item: any) => ({
      ...item,
      modelo_pallet: Array.isArray(item.modelo_pallet) ? item.modelo_pallet[0] : item.modelo_pallet
    }));

    const mappedMovimentacoes = (movData || []).map((mov: any) => ({
      ...mov,
      modelo_pallet: Array.isArray(mov.modelo_pallet) ? mov.modelo_pallet[0] : mov.modelo_pallet
    }));

    return (
      <AdminEstoqueClient 
        initialEstoque={mappedEstoque} 
        initialMovimentacoes={mappedMovimentacoes} 
      />
    );
  } catch (err: any) {
    console.error("[AdminEstoquePage] Critical Error:", err.message);
    return (
      <AdminEstoqueClient 
        initialEstoque={[]} 
        initialMovimentacoes={[]} 
        error={{
          message: "Falha ao carregar estoque.",
          details: err.message,
          code: err.code,
          hint: err.hint
        }}
      />
    );
  }
}
