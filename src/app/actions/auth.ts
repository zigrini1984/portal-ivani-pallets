"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type UsuarioPerfil = "admin" | "cliente";

const SESSION_COOKIE = "ivani_portal_usuario";

/**
 * Cria um cliente Supabase com Service Role Key.
 * NÃO usa fallback para anon key — a Service Role é obrigatória
 * porque a tabela public.usuarios tem RLS ativo.
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[auth] env check", {
    hasUrl: Boolean(supabaseUrl),
    hasServiceRole: Boolean(serviceRoleKey),
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "MISSING",
  });

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getRedirectByPerfil(perfil: UsuarioPerfil): string {
  return perfil === "admin" ? "/admin/configuracao" : "/cliente/dashboard";
}

export async function login(formData: FormData) {
  const rawEmail = formData.get("email")?.toString() ?? "";
  const rawPassword = formData.get("password")?.toString() ?? "";

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  console.log("[login] tentativa para:", email);

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err: any) {
    console.error("[login] falha ao criar cliente supabase:", err.message);
    return { error: "Erro interno do servidor. Tente novamente." };
  }

  try {
    const { data: rows, error } = await supabase
      .from("usuarios")
      .select("id,nome,email,perfil,ativo")
      .eq("email", email)
      .eq("senha", password)
      .eq("ativo", true)
      .limit(1);

    // Extrai o primeiro resultado do array (equivalente ao maybeSingle sem o operador ?)
    const data = rows && rows.length > 0 ? rows[0] : null;

    if (error) {
      console.error("[login] erro supabase", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return { error: "Erro ao validar login: " + error.message };
    }

    console.log("[login] usuario encontrado:", Boolean(data));

    if (!data) {
      return { error: "E-mail ou senha incorretos." };
    }

    if (data.perfil !== "admin" && data.perfil !== "cliente") {
      return { error: "Perfil de usuário inválido." };
    }

    const redirectTo = getRedirectByPerfil(data.perfil as UsuarioPerfil);
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

    // Se chegou aqui, login deu certo. Salva o cookie e redireciona.
    return redirect(redirectTo);
  } catch (err: any) {
    console.error("[login] erro inesperado:", err.message);
    return { error: "Erro de conexão com o banco de dados. Tente novamente." };
  }
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);

  revalidatePath("/", "layout");
  redirect("/login");
}