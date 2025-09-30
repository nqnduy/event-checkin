import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
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
				set(name: string, value: string, options: any) {
					response.cookies.set({
						name,
						value,
						...options,
					});
				},
				remove(name: string, options: any) {
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
	if (request.nextUrl.pathname.startsWith("/admin")) {
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

	if (request.nextUrl.pathname.startsWith("/dashboard")) {
		if (!user) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	return response;
}

export const config = {
	matcher: ["/admin/:path*", "/dashboard/:path*"],
};
