import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const protectedRoutes = ["/dashboard", "/products", "/delivery-zones", "/orders"];
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("your-project-ref") &&
    !supabaseKey.includes("your-supabase-")
  );

  // If Supabase credentials are not configured, allow inspection without breaking local preview
  if (!isConfigured) {
    return supabaseResponse;
  }

  // Quick check: if there are no supabase auth cookies at all
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  if (!hasAuthCookie) {
    // Unauthenticated user attempting to access protected route -> Redirect to /login
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(url);
    }
    // Allow public or login route immediately without remote call
    return supabaseResponse;
  }

  // User has auth cookie -> Validate session and refresh token via Supabase SSR
  try {
    const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Invalid/expired token trying to access protected route
    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(url);
    }

    // Authenticated user attempting to access /login -> Redirect to /dashboard
    if (user && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("Middleware auth verification error:", err);
  }

  return supabaseResponse;
}
