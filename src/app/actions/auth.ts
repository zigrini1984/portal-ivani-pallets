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

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .ilike("email", email)
    .eq("senha", password)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data) {
    return { error: "Invalid login credentials" };
  }

  // 🔥 opcional: salvar sessão simples
  return {
    success: true,
    user: data,
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}