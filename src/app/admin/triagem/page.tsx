export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { AdminTriagemClient } from "./client";

export default async function AdminTriagemPage() {
  const supabase = createAdminClient();

  // Buscar modelos de pallets ativos
  const { data: modelosData } = await supabase
    .from("modelos_pallets")
    .select("id, nome, codigo, medidas")
    .eq("ativo", true)
    .order("nome");

  // Buscar triagens
  const { data: triagensData, error: triagensError } = await supabase
    .from("triagens")
    .select(
      "id, cliente_id, coleta_id, nf_saida_pce, motorista, caminhao, data_coleta, quantidade_total, quantidade_sucata, quantidade_manutencao, quantidade_remanufatura, quantidade_compra_ivani, status, observacao, created_at"
    )
    .eq("cliente_id", "pce")
    .order("created_at", { ascending: false });

  if (triagensError) {
    console.error("[AdminTriagemPage] Erro ao buscar triagens:", triagensError.message);
  }

  // Buscar itens das triagens para exibição nos cards
  let triagensComItens: any[] = [];

  if (triagensData && triagensData.length > 0) {
    const triagemIds = triagensData.map((t) => t.id);

    const { data: itensData } = await supabase
      .from("triagem_itens")
      .select(
        "id, triagem_id, modelo_pallet_id, quantidade_reforma, quantidade_remanufatura, quantidade_compra_ivani, quantidade_sucateado"
      )
      .in("triagem_id", triagemIds);

    triagensComItens = triagensData.map((triagem) => ({
      ...triagem,
      itens: itensData
        ? itensData.filter((item) => item.triagem_id === triagem.id)
        : [],
    }));
  }

  return (
    <AdminTriagemClient
      initialTriagens={triagensComItens}
      initialModelosPallets={modelosData || []}
      serverError={triagensError ? triagensError.message : null}
    />
  );
}


