import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";

const PROTECTED_PATHS = [/^\/dashboard-admin(\/.*)?$/];

export async function authMiddleware(request) {
	const { pathname } = request.nextUrl;
	const shouldProtect = PROTECTED_PATHS.some((regex) => regex.test(pathname));
	if (!shouldProtect) {
		return NextResponse.next();
	}

	const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	const session = await verifySession(token);
	if (!session) {
		const redirectUrl = new URL("/admin", request.url);
		if (pathname && pathname !== "/dashboard-admin") {
			redirectUrl.searchParams.set("redirectTo", pathname);
		}
		return NextResponse.redirect(redirectUrl);
	}

	return NextResponse.next();
}
