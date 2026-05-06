"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type LoginResult = {
  success?: boolean;
  error?: string;
  redirectTo?: string;
};

type PerfilUsuario = "admin" | "cliente";

const SESSION_COOKIE = "ivani_portal_usuario";

function getRedirectByPerfil(perfil: PerfilUsuario) {
  return perfil === "admin" ? "/admin/configuracao" : "/cliente/dashboard";
}

export async function login(formData: FormData): Promise<LoginResult> {
  try {
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

    let perfil: PerfilUsuario | null = null;
    let nome = "";

    if (email === "admin@teste.com" && password === "123456") {
      perfil = "admin";
      nome = "Admin Teste";
    }

    if (email === "cliente@teste.com" && password === "123456") {
      perfil = "cliente";
      nome = "Cliente Teste";
    }

    if (!perfil) {
      return {
        error: "E-mail ou senha incorretos.",
      };
    }

    const redirectTo = getRedirectByPerfil(perfil);
    const cookieStore = await cookies();

    cookieStore.set(
      SESSION_COOKIE,
      JSON.stringify({
        id: email,
        email,
        nome,
        perfil,
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
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no login.";

    return {
      error: message,
    };
  }
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);

  redirect("/login");
}