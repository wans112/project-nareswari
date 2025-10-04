"use client";

import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "./button";

/*
	Komponen: NavbarFloat

	Props yang diharapkan:
	- brand: string (nama brand yang ditampilkan)
	- links: array of { href, label, sublink?: [{ href, label }] } (required)
	- cta: optional { href, label }
	- initialOpen: boolean (optional, default false)

	Catatan:
	- Default props sengaja dihapus. Pastikan setiap pemanggil (mis. page atau layout)
		selalu mengirimkan `links` agar komponen tidak mengembalikan null.
	- Jika `links` tidak berbentuk array, komponen akan mencetak pesan error ke console
		dan tidak merender apa pun (safety-first).
*/
export default function NavbarFloat({ brand, links, cta, initialOpen = false }) {
	const [open, setOpen] = useState(!!initialOpen);

	// Validasi ringan: links wajib berupa array. Jika tidak valid, tampilkan pesan di console
	if (!Array.isArray(links)) {
		console.error("NavbarFloat: prop 'links' harus berupa array. Contoh: [{ href: '#home', label: 'Home' }]");
		return null; // hentikan render agar tidak terjadi error runtime
	}

	return (
		<div className="fixed inset-x-0 top-6 flex justify-center z-50 pointer-events-none">
			<nav className="pointer-events-auto w-full max-w-5xl px-4">
				<div className="bg-black/45 backdrop-blur-md border border-white/10 rounded-xl shadow-lg px-4 py-2 flex items-center justify-between">
					<div className="flex items-center gap-4">
                        <a href="/" className="text-white font-bold text-md md:text-base mx-2 px-2">{brand}</a>

                        <div className="hidden md:flex items-center gap-6">
                            {links.map((l) => {
                                // Jika ada sublink, render dropdown sederhana (desktop)
                                if (l.sublink && Array.isArray(l.sublink)) {
                                    return (
                                        <div key={l.label} className="relative group">
                                            <button className="text-white text-sm flex items-center gap-2 hover:underline" aria-haspopup="true">
                                                {l.label}
												<ChevronDown className="h-4 w-4" />
                                            </button>
                                            <div className="absolute left-0 mt-4 w-48 bg-black/45 rounded-xl py-2 shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all">
                                                {l.sublink.map((s) => (
                                                    <a key={s.href || s.label} href={s.href} className="block px-4 py-2 text-sm text-white hover:bg-white/5">{s.label}</a>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                // Link biasa
                                return (
                                    <a key={l.href} href={l.href} className="text-white text-sm hover:underline">{l.label}</a>
                                );
                            })}
                        </div>
					</div>

					<div className="flex items-center gap-3">
									{cta && (
										<Button asChild size="sm" className="hidden sm:inline-flex border text-white px-4 py-2 rounded-xl text-sm font-medium shadow bg-transparent hover:bg-white hover:text-black transition-transform duration-300 ease-in-out">
											<a href={cta.href}>{cta.label}</a>
										</Button>
									)}

						<button
							type="button"
							aria-label="Toggle menu"
							aria-expanded={open}
							onClick={() => setOpen(!open)}
							className="inline-flex items-center justify-center p-2 rounded-xl text-white md:hidden"
						>
							{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				{open && (
					<div className="mt-3 md:hidden bg-black/50 backdrop-blur rounded-xl p-3 shadow-lg">
                        <div className="flex flex-col gap-2">
                            {links.map((l) => (
                                l.sublink ? (
                                    <div key={l.label} className="flex flex-col">
                                        <div className="px-3 py-2 text-white font-medium">{l.label}</div>
                                        <div className="flex flex-col ml-3">
                                            {l.sublink.map((s) => (
                                                <a key={s.href || s.label} href={s.href} onClick={() => setOpen(false)} className="text-white px-3 py-2 rounded-xl hover:bg-white/5">{s.label}</a>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-white px-3 py-2 rounded-xl hover:bg-white/5">{l.label}</a>
                                )
                            ))}
							{cta && (
								<Button asChild size="sm" className="mt-1 w-full inline-flex justify-center bg-transparent border">
									<a href={cta.href} onClick={() => setOpen(false)}>{cta.label}</a>
								</Button>
							)}
                        </div>
				    </div>
				)}
			</nav>
		</div>
	);
}
