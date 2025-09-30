// src/app/api/get-client-ip/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const forwardedFor = request.headers.get("x-forwarded-for");
	const realIP = request.headers.get("x-real-ip");

	let ip = null;

	if (forwardedFor) {
		ip = forwardedFor.split(",")[0].trim();
	} else if (realIP) {
		ip = realIP;
	}

	// Detect localhost
	const isLocalhost = ip === "::1" || ip === "127.0.0.1" || !ip;

	// Nếu là localhost, có thể fetch real IP từ external service (optional)
	if (isLocalhost && process.env.NODE_ENV === "development") {
		try {
			const response = await fetch("https://api.ipify.org?format=json");
			const data = await response.json();
			ip = data.ip || ip;
		} catch {
			// Keep localhost IP
		}
	}

	return NextResponse.json({
		ip: ip || "::1",
		isLocalhost,
		environment: process.env.NODE_ENV,
	});
}
