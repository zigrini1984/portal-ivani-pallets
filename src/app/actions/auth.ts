"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString().trim();

  if (!email || !password) {
    return { error: "Preencha todos os campos" };
  }

  // Buscar usuário na tabela public.usuarios
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .ilike("email", email)
    .eq("senha", password)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data) {
    return { error: "E-mail ou senha incorretos ou conta inativa." };
  }

  // Definir rota de redirecionamento conforme perfil
  let redirectTo = "/cliente/dashboard";
  if (data.perfil === "admin") {
    redirectTo = "/admin/configuracao";
  }

  return {
    success: true,
    redirectTo,
    user: {
      id: data.id,
      email: data.email,
      perfil: data.perfil,
      nome: data.nome
    }
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}