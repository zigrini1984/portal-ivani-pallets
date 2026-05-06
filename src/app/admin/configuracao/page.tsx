import { createClientServer } from "@/lib/supabase/server";
import { AdminConfiguracaoClient } from "./client";

export default async function AdminConfiguracaoPage() {
  const supabase = createClientServer();

  // 1. Buscar Modelos
  const { data: modelos } = await supabase
    .from("modelos_pallets")
    .select("id, cliente_id, nome, codigo, medidas, preco_pallet_novo, preco_reforma, preco_remanufatura, preco_compra_ivani, ativo, observacao")
    .eq("cliente_id", "pce")
    .order("codigo", { ascending: true });

  // 2. Buscar Usuários
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, ativo, created_at, updated_at")
    .order("nome", { ascending: true });

  // 3. Buscar Logs de Acesso
  const { data: logs } = await supabase
    .from("portal_acessos")
    .select("id, created_at, usuario_nome, rota, usuario_id, email, tipo_usuario, area")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminConfiguracaoClient 
      initialModelos={modelos ?? []} 
      initialUsuarios={usuarios ?? []} 
      initialLogs={logs ?? []} 
    />
  );
}
