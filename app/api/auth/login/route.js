import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { init, get } from "@/lib/db";
import {
	createSession,
	sanitizeUsername,
	setSessionCookie,
} from "@/lib/auth";

function validateCredentials(username, password) {
	const sanitizedUsername = sanitizeUsername(username).toLowerCase();
	const sanitizedPassword = typeof password === "string" ? password.trim() : "";
	if (/<|>/g.test(sanitizedPassword)) {
		return { error: "Username atau password tidak valid." };
	}

	if (!sanitizedUsername || sanitizedUsername.length < 3) {
		return { error: "Username atau password tidak valid." };
	}

	if (!sanitizedPassword || sanitizedPassword.length < 8) {
		return { error: "Username atau password tidak valid." };
	}

	return { username: sanitizedUsername, password: sanitizedPassword };
}

export async function POST(request) {
	let body;
	try {
		body = await request.json();
	} catch (error) {
		return NextResponse.json({ message: "Payload tidak valid." }, { status: 400 });
	}

	const { username, password } = body ?? {};
	const validated = validateCredentials(username, password);
	if (validated.error) {
		return NextResponse.json({ message: validated.error }, { status: 400 });
	}

	try {
		await init();
		const user = await get(
			"SELECT id, username, password, name FROM users WHERE LOWER(username) = ? LIMIT 1",
			[validated.username]
		);

		if (!user) {
			return NextResponse.json({ message: "Username atau password salah." }, { status: 401 });
		}

		const isValid = await bcrypt.compare(validated.password, user.password ?? "");
		if (!isValid) {
			return NextResponse.json({ message: "Username atau password salah." }, { status: 401 });
		}

		const { token, expiresAt } = await createSession({
			userId: user.id,
			username: user.username,
			name: user.name,
		});

		const response = NextResponse.json({ success: true, redirect: "/dashboard-admin" }, { status: 200 });
		setSessionCookie(response, token, expiresAt);
		return response;
	} catch (error) {
		console.error("[auth/login]", error);
		return NextResponse.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
	}
}
