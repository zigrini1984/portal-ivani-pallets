import { createClient } from "@/lib/supabase/server";
import { AdminFaturamentoClient } from "./client";

export default async function AdminFaturamentoPage() {
  const supabase = await createClient();

  // 1. Buscar Faturamentos e Parcelas
  const { data: fatData } = await supabase
    .from("faturamentos")
    .select(`
      *,
      modelo_pallet:modelos_pallets(nome, codigo),
      parcelas:faturamento_parcelas(*)
    `)
    .eq("cliente_id", "pce")
    .order("data_saida", { ascending: false });

  // 2. Buscar Saídas de Estoque que ainda não estão faturadas
  const { data: allSaidas } = await supabase
    .from("estoque_movimentacoes")
    .select(`
      id, quantidade, created_at, modelo_pallet_id, origem,
      modelo_pallet:modelos_pallets(nome, codigo, preco_reforma, preco_remanufatura)
    `)
    .eq("cliente_id", "pce")
    .eq("tipo", "saida")
    .order("created_at", { ascending: false });

  // Filtrar as que já foram faturadas (estoque_movimentacao_id no faturamentos)
  const faturadasIds = new Set(fatData?.map((f: any) => f.estoque_movimentacao_id));
  const pendentes = allSaidas?.filter((s: any) => !faturadasIds.has(s.id)) || [];

  return <AdminFaturamentoClient initialFaturamentos={fatData as any || []} initialSaidasPendentes={pendentes as any} />;
}
