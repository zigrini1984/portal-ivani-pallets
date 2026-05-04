import { NextResponse, type NextRequest } from "next/server";

type UsuarioPerfil = "admin" | "cliente";

type PortalSession = {
  id: string;
  email: string;
  nome: string | null;
  perfil: UsuarioPerfil;
};

const SESSION_COOKIE = "ivani_portal_usuario";

function parseSession(value?: string): PortalSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<PortalSession>;

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.email !== "string" ||
      (parsed.perfil !== "admin" && parsed.perfil !== "cliente")
    ) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      nome: typeof parsed.nome === "string" ? parsed.nome : null,
      perfil: parsed.perfil,
    };
  } catch {
    return null;
  }
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);

  const isLoginPage = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isClienteRoute = pathname.startsWith("/cliente");
  const isProtectedRoute = isAdminRoute || isClienteRoute;

  if (isLoginPage && session) {
    return redirectTo(
      request,
      session.perfil === "admin" ? "/admin/configuracao" : "/cliente/dashboard"
    );
  }

  if (!session && isProtectedRoute) {
    return redirectTo(request, "/login");
  }

  if (session?.perfil === "admin" && isClienteRoute) {
    return redirectTo(request, "/admin/configuracao");
  }

  if (session?.perfil === "cliente" && isAdminRoute) {
    return redirectTo(request, "/cliente/dashboard");
  }

  return NextResponse.next({
    request,
  });
}
