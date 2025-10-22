"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const sanitizeClientInput = (value = "") =>
	value
		.replace(/[<>]/g, "")
		.replace(/\s{2,}/g, " ")
		.trim();

export default function AdminLoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [statusMessage, setStatusMessage] = useState(() => {
		const redirectFlag = searchParams?.get("redirectTo");
		return redirectFlag ? "Sesi Anda berakhir. Silakan login kembali." : "";
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setStatusMessage("");

		const safeUsername = sanitizeClientInput(username).toLowerCase();
		const safePassword = password.trim();

		if (!safeUsername || !safePassword) {
			setError("Username dan password wajib diisi.");
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: safeUsername, password: safePassword }),
				credentials: "same-origin",
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				setError(data?.message || "Login gagal. Silakan periksa kembali.");
				return;
			}

			router.replace(data?.redirect ?? "/dashboard-admin");
		} catch (err) {
			setError("Tidak dapat terhubung ke server. Coba beberapa saat lagi.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="min-h-screen w-full bg-gradient-to-br from-white via-blue-50 to-sky-100 text-slate-800 flex items-center justify-center px-4 py-12">
			<Card className="w-full max-w-md border-blue-200 bg-white text-slate-900 shadow-lg">
				<CardHeader>
					<CardTitle className="text-center text-2xl font-bold text-blue-700">Login</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-5" onSubmit={handleSubmit} autoComplete="on">
						{statusMessage ? (
							<p className="rounded-md border border-emerald-400/50 bg-emerald-100/70 px-3 py-2 text-sm text-emerald-700">
								{statusMessage}
							</p>
						) : null}
						{error ? (
							<p className="rounded-md border border-red-400/50 bg-red-100/80 px-3 py-2 text-sm text-red-700">
								{error}
							</p>
						) : null}
						<div className="space-y-2">
							<label htmlFor="username" className="text-sm font-medium text-slate-700">
								Username
							</label>
							<Input
								id="username"
								type="text"
								autoComplete="username"
								inputMode="text"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								placeholder="Masukkan username"
								className="bg-white text-slate-900 border-blue-200 focus-visible:border-blue-500 focus-visible:ring-blue-200/70"
								required
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-medium text-slate-700">
								Password
							</label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="Masukkan password"
								className="bg-white text-slate-900 border-blue-200 focus-visible:border-blue-500 focus-visible:ring-blue-200/70"
								required
							/>
						</div>
						<Button type="submit" className="w-full bg-blue-600 !text-white hover:bg-blue-700" disabled={isSubmitting}>
							{isSubmitting ? "Memproses..." : "Masuk"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
