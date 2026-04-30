import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() é necessário para validar a sessão
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthRoute = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/cliente')

  // Redirecionar se não estiver logado e tentar acessar rota protegida
  if (!user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirecionar baseado no perfil se estiver logado
  if (user) {
    // Buscar perfil do usuário
    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('id', user.id)
      .single()

    // Se estiver na login e já estiver logado, redireciona para o dashboard correto
    if (isLoginPage) {
      const url = request.nextUrl.clone()
      if (perfil?.tipo === 'admin') {
        url.pathname = '/admin/lotes'
      } else {
        url.pathname = '/cliente/dashboard'
      }
      return NextResponse.redirect(url)
    }

    // RBAC: Admin não acessa rotas de cliente e vice-versa
    if (request.nextUrl.pathname.startsWith('/admin') && perfil?.tipo !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/cliente/dashboard'
      return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname.startsWith('/cliente') && perfil?.tipo === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/lotes'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
