"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type UsuarioPerfil = "admin" | "cliente";

type UsuarioLogin = {
  id: string;
  email: string;
  nome: string | null;
  perfil: UsuarioPerfil;
};

const SESSION_COOKIE = "ivani_portal_usuario";

function getRedirectByPerfil(perfil: UsuarioPerfil) {
  return perfil === "admin" ? "/admin/configuracao" : "/cliente/dashboard";
}

export async function login(formData: FormData) {
  const rawEmail = formData.get("email")?.toString() ?? "";
  const rawPassword = formData.get("password")?.toString() ?? "";

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  console.log("[login] email recebido:", email);

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("usuarios")
    .select("id,email,nome,perfil")
    .eq("email", email)
    .eq("senha", password)
    .eq("ativo", true)
    .maybeSingle<UsuarioLogin>();

  if (error) {
    console.error("[login] erro supabase:", error);
    return { error: "Não foi possível validar o login. Tente novamente." };
  }

  console.log("[login] usuario encontrado:", Boolean(data));

  if (!data) {
    return { error: "E-mail ou senha incorretos, ou usuário inativo." };
  }

  if (data.perfil !== "admin" && data.perfil !== "cliente") {
    return { error: "Perfil de usuário inválido." };
  }

  const redirectTo = getRedirectByPerfil(data.perfil);
  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    JSON.stringify({
      id: data.id,
      email: data.email,
      nome: data.nome,
      perfil: data.perfil,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    }
  );

  return {
    success: true,
    redirectTo,
    user: {
      id: data.id,
      email: data.email,
      nome: data.nome,
      perfil: data.perfil,
    },
  };
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);

  revalidatePath("/", "layout");
  redirect("/login");
}