export const dynamic = "force-dynamic";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminColetaClient } from "./client";

export default async function AdminColetaPage() {
  const supabase = createAdminClient();

  // Buscar Coletas via Admin Client (ignora RLS, pois a rota já é protegida)
  const { data: coletasData, error: supabaseError } = await supabase
    .from("coletas")
    .select("id, cliente_id, data_coleta, quantidade_material_bruto, motorista, caminhao, status, observacao, created_at, nf_saida_pce, enviado_triagem, data_envio_triagem")
    .eq("cliente_id", "pce")
    .order("data_coleta", { ascending: false });

  // Log no servidor para facilitar debug
  if (supabaseError) {
    console.error("[AdminColetaPage] Erro ao buscar coletas:", supabaseError.message);
  } else if (!coletasData || coletasData.length === 0) {
    console.warn("[AdminColetaPage] Nenhuma coleta encontrada.");
  }

  return (
    <AdminColetaClient
      initialColetas={coletasData || []}
      error={supabaseError ? JSON.stringify(supabaseError, null, 2) : null}
    />
  );
}


