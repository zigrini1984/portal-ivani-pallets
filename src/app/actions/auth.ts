"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Buscar perfil para decidir redirecionamento
  const { data: perfil } = await supabase
    .from("perfis")
    .select("tipo")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/", "layout");

  if (perfil?.tipo === "admin") {
    redirect("/admin/coleta");
  } else {
    redirect("/cliente/dashboard");
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
