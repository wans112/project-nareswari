import { authMiddleware } from "./middleware/auth";

export function middleware(request) {
	return authMiddleware(request);
}

export const config = {
	matcher: ["/dashboard-admin/:path*"],
};
