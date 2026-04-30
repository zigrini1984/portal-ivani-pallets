import { createClient } from "@/lib/supabase/client";

export async function registrarAcesso(area: string) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar perfil para saber o tipo
    const { data: perfil } = await supabase
      .from("perfis")
      .select("tipo")
      .eq("id", user.id)
      .single();

    await supabase.from("portal_acessos").insert({
      usuario_id: user.id,
      email: user.email,
      tipo_usuario: perfil?.tipo || 'desconhecido',
      area: area
    });
  } catch (err) {
    console.error("Erro ao registrar acesso:", err);
  }
}
