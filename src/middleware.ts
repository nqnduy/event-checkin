import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, options: { expires?: Date; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean }) {
					response.cookies.set({
						name,
						value,
						...options,
					});
				},
				remove(name: string, options: { path?: string; domain?: string }) {
					response.cookies.set({
						name,
						value: "",
						...options,
					});
				},
			},
		}
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Protected routes
	if (pathname.startsWith("/admin")) {
		if (!user) {
			return NextResponse.redirect(new URL("/login", request.url));
		}

		// Check admin role
		const { data: userData } = await supabase
			.from("app_users")
			.select("role")
			.eq("id", user.id)
			.single();

		if (userData?.role !== "admin") {
			console.log("Non-admin trying to access admin area:", userData);
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
	}

	if (pathname.startsWith("/dashboard")) {
		if (!user) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	if (pathname === '/') {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	if (pathname === '/login') {
		if (user) {
			return NextResponse.redirect(new URL('/admin/dashboard', request.url))
		}
	}

	return response;
}

export const config = {
	matcher: ["/admin/:path*", "/dashboard/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
