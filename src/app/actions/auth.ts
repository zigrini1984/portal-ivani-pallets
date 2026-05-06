"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type LoginResult = {
  success?: boolean;
  error?: string;
  redirectTo?: string;
};

type PerfilUsuario = "admin" | "cliente";

const SESSION_COOKIE = "ivani_portal_usuario";

function getRedirectByPerfil(perfil: PerfilUsuario) {
  return perfil === "admin" ? "/admin/coleta" : "/cliente/dashboard";
}

export async function login(formData: FormData): Promise<LoginResult> {
  const rawEmail = String(formData.get("email") || "");
  const rawPassword =
    String(formData.get("password") || "") ||
    String(formData.get("senha") || "");

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  if (!email || !password) {
    return {
      error: "Preencha e-mail e senha.",
    };
  }

  try {
    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from("usuarios")
      .select("id,nome,email,senha,perfil,ativo")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error("[login] erro db:", error.message);
      return { error: "Erro de comunicação com o servidor." };
    }

    const usuario = rows && rows.length > 0 ? rows[0] : null;

    if (!usuario) {
      return { error: "E-mail ou senha incorretos." };
    }

    if (usuario.senha !== password) {
      return { error: "E-mail ou senha incorretos." };
    }

    if (usuario.ativo !== true) {
      return { error: "Usuário inativo." };
    }

    if (usuario.perfil !== "admin" && usuario.perfil !== "cliente") {
      return { error: "Perfil de usuário inválido." };
    }

    const cookieStore = await cookies();

    cookieStore.set(
      SESSION_COOKIE,
      JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        perfil: usuario.perfil,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 horas
      }
    );

    return {
      success: true,
      redirectTo: getRedirectByPerfil(usuario.perfil as PerfilUsuario),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no login.";
    console.error("[login] erro try/catch:", message);
    return {
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}