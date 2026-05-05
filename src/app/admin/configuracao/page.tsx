import { createClient } from "@/lib/supabase/server";
import { AdminConfiguracaoClient } from "./client";

export default async function AdminConfiguracaoPage() {
  const supabase = await createClient();

  // 1. Buscar Modelos
  const { data: modelos } = await supabase
    .from("modelos_pallets")
    .select("*")
    .eq("cliente_id", "pce")
    .order("codigo", { ascending: true });

  // 2. Buscar Usuários
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("*")
    .order("nome", { ascending: true });

  // 3. Buscar Logs de Acesso
  const { data: logs } = await supabase
    .from("portal_acessos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminConfiguracaoClient 
      initialModelos={modelos || []} 
      initialUsuarios={usuarios || []} 
      initialLogs={logs || []} 
    />
  );
}
