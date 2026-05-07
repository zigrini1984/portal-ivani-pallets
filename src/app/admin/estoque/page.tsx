export const dynamic = "force-dynamic";

import { createClientServer } from "@/lib/supabase/server";
import { AdminEstoqueClient } from "./client";

export default async function AdminEstoquePage() {
  const supabase = createClientServer();

  const { data: estData } = await supabase
    .from("estoque_pallets")
    .select(`
      *,
      modelo_pallet:modelos_pallets(nome, codigo, medidas)
    `)
    .eq("cliente_id", "pce");

  const { data: movData } = await supabase
    .from("estoque_movimentacoes")
    .select(`
      *,
      modelo_pallet:modelos_pallets(nome)
    `)
    .eq("cliente_id", "pce")
    .order("created_at", { ascending: false })
    .limit(50);

  return <AdminEstoqueClient initialEstoque={estData || []} initialMovimentacoes={movData || []} />;
}


