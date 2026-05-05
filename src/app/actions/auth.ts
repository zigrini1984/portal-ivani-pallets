"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type UsuarioPerfil = "admin" | "cliente";

const SESSION_COOKIE = "ivani_portal_usuario";

/**
 * Cria um cliente Supabase com Service Role para consultas server-side seguras.
 * Necessário porque a tabela public.usuarios tem RLS que bloqueia a anon key.
 */
function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  console.log("[auth] env check", {
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(serviceRoleKey),
  });

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configuração do servidor incompleta.");
  }

  return createServiceClient(supabaseUrl, serviceRoleKey, {
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
    supabase = createAuthClient();
  } catch (err: any) {
    console.error("[login] falha ao criar cliente supabase:", err.message);
    return { error: "Erro interno do servidor. Tente novamente." };
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nome,email,perfil,ativo")
    .eq("email", email)
    .eq("senha", password)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error("[login] erro supabase", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return { error: "Erro Supabase: " + error.message };
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