import { createClientServer } from "@/lib/supabase/server";
import { AdminManutencaoClient } from "./client";

export default async function AdminManutencaoPage() {
  const supabase = createClientServer();

  // 1. Buscar itens de triagem que precisam de reforma
  const { data: triagemItens } = await supabase
    .from("triagem_itens")
    .select(`
      *,
      modelo_pallet:modelos_pallets(id, nome, codigo, medidas),
      triagem:triagens!inner(id, nf_saida_pce, data_coleta, status, cliente_id)
    `)
    .gt("quantidade_reforma", 0)
    .eq("triagem.cliente_id", "pce");

  // 2. Buscar manutenções existentes
  const { data: manutencoes } = await supabase
    .from("manutencoes")
    .select("id, triagem_item_id, status, observacao, created_at, quantidade_concluida, quantidade_sucata")
    .eq("cliente_id", "pce");

  // 3. Mesclar dados
  const listagem = (triagemItens || []).map((it: any) => {
    const manut = manutencoes?.find((m: any) => m.triagem_id === it.triagem_id && m.modelo_pallet_id === it.modelo_pallet_id);
    return {
      ...it,
      manutencao: manut || null,
      quantidade_entrada: it.quantidade_reforma,
      quantidade_concluida: manut?.quantidade_concluida || 0,
      quantidade_sucata: manut?.quantidade_sucata || 0,
      status: manut?.status || 'aguardando',
      observacao: manut?.observacao || ""
    };
  });

  return <AdminManutencaoClient initialItemsPendente={listagem} />;
}
