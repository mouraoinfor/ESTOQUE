import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerSessao } from "@/lib/sessao";

export async function middleware(request: NextRequest) {
  const sessao = await lerSessao(request.cookies.get(COOKIE_SESSAO)?.value);
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  // Sessão recusada pelo servidor (usuário removido): apaga o cookie e mostra o login
  if (isLogin && request.nextUrl.searchParams.has("sair")) {
    const url = request.nextUrl.clone();
    url.search = "";
    const res = NextResponse.redirect(url);
    res.cookies.delete(COOKIE_SESSAO);
    return res;
  }

  if (!sessao && !isLogin) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return new NextResponse("Não autorizado", { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (sessao && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
