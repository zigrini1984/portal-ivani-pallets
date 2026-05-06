"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Tipo de retorno da Server Action de login
 */
type LoginResult = {
  success?: boolean;
  error?: string;
  redirectTo?: string;
};

/**
 * LOGIN
 */
export async function login(formData: FormData): Promise<LoginResult> {
  try {
    const email = String(formData.get("email") || "");
    const senha = String(formData.get("senha") || "");

    // 🔒 Validação simples (ajuste depois para banco)
    if (email === "admin@teste.com" && senha === "123456") {

      // cria cookie de sessão simples
      cookies().set("ivani_portal_usuario", email, {
        httpOnly: true,
        path: "/",
      });

      return {
        success: true,
        redirectTo: "/admin/coleta",
      };
    }

    return {
      error: "Credenciais inválidas",
    };

  } catch (err: any) {
    return {
      error: err?.message || "Erro no login",
    };
  }
}

/**
 * LOGOUT
 */
export async function logout() {
  try {
    // remove cookie
    cookies().delete("ivani_portal_usuario");

    // redireciona
    redirect("/login");

  } catch (err) {
    console.error("Erro no logout:", err);
  }
}