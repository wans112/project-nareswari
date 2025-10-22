export const SESSION_COOKIE_NAME = "nareswari_session";
const SESSION_TTL_SECONDS = 60 * 60 * 4; // 4 hours
const FALLBACK_SECRET = "dev-secret-change-me";

const resolvedSecret = (() => {
	const envSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
	if (!envSecret) {
		if (process.env.NODE_ENV === "production") {
			throw new Error("AUTH_SECRET is required in production for session signing.");
		}
		console.warn("[auth] Using fallback session secret. Set AUTH_SECRET in .env for stronger security.");
		return FALLBACK_SECRET;
	}
	return envSecret;
})();

const textEncoder = new TextEncoder();
let cachedCryptoKey = null;

function runtimeCrypto() {
	if (typeof globalThis.crypto !== "undefined" && globalThis.crypto?.subtle) {
		return globalThis.crypto;
	}
	throw new Error("Web Crypto API is not available in this environment.");
}

async function importSigningKey() {
	if (cachedCryptoKey) return cachedCryptoKey;
	const key = await runtimeCrypto().subtle.importKey(
		"raw",
		textEncoder.encode(resolvedSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"]
	);
	cachedCryptoKey = key;
	return key;
}

function arrayBufferToBase64Url(buffer) {
	if (typeof Buffer !== "undefined") {
		return Buffer.from(buffer)
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/g, "");
	}
	let binary = "";
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.length; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}
	const base64 = btoa(binary);
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeCompare(a, b) {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i += 1) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

async function hashMessage(message) {
	const key = await importSigningKey();
	const signature = await runtimeCrypto().subtle.sign("HMAC", key, textEncoder.encode(message));
	return arrayBufferToBase64Url(signature);
}

function encodePayload(payload) {
	return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded) {
	try {
		const json = Buffer.from(encoded, "base64url").toString("utf8");
		return JSON.parse(json);
	} catch (err) {
		return null;
	}
}

export async function createSession({ userId, username, name }) {
	const issuedAt = Date.now();
	const expiresAt = issuedAt + SESSION_TTL_SECONDS * 1000;
	const payload = { userId, username, name, issuedAt, expiresAt };
	const encoded = encodePayload(payload);
	const signature = await hashMessage(encoded);
	return { token: `${encoded}.${signature}`, expiresAt };
}

export async function verifySession(token) {
	if (!token || typeof token !== "string") return null;
	const [encoded, signature] = token.split(".");
	if (!encoded || !signature) return null;

	const expectedSignature = await hashMessage(encoded);
	if (!safeCompare(signature, expectedSignature)) return null;

	const payload = decodePayload(encoded);
	if (!payload) return null;
	if (typeof payload.expiresAt !== "number" || Date.now() > payload.expiresAt) return null;
	return payload;
}

export function setSessionCookie(response, token, expiresAt) {
	response.cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		expires: new Date(expiresAt),
	});
}

export function clearSessionCookie(response) {
	response.cookies.set(SESSION_COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		expires: new Date(0),
	});
}

export function sanitizeText(value = "") {
	return String(value ?? "")
		.replace(/<[^>]*>?/g, "")
		.replace(/["'`;(){}]/g, "")
		.trim();
}

export function sanitizeUsername(value = "") {
	return sanitizeText(value).replace(/[^a-zA-Z0-9@._-]/g, "");
}
