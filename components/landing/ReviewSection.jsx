"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import 'bootstrap-icons/font/bootstrap-icons.css';

function Stars({ value = 0, max = 5 }) {
	return (
		<div className="flex items-center gap-1" aria-hidden="true">
			{Array.from({ length: max }).map((_, i) => {
				const filled = i < value;
				return filled ? (
					<i key={i} className="bi bi-star-fill inline-block text-yellow-400 text-[16px] md:text-[18px]" />
				) : (
					<i key={i} className="bi bi-star inline-block text-white/40 text-[16px] md:text-[18px]" />
				);
			})}
		</div>
	);
}

export default function ReviewSection() {
	const containerRef = useRef(null);
	const timelineRef = useRef(null);
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let active = true;
		async function loadReviews() {
			setLoading(true);
			try {
				const res = await fetch('/api/reviews', { cache: 'no-store' });
				if (!res.ok) throw new Error(`Gagal memuat ulasan: ${res.status}`);
				const data = await res.json();
				if (!active) return;
				const normalized = Array.isArray(data)
					? data.map((item, idx) => ({
						id: item.id ?? idx,
						href: item.href || '#',
						name: item.nama || 'Anonim',
						rating: Number(item.rating) || 0,
						text: item.isi || '',
					}))
					: [];
				setReviews(normalized);
				setError(null);
			} catch (err) {
				if (!active) return;
				setError(err.message);
				setReviews([]);
			} finally {
				if (active) setLoading(false);
			}
		}

		loadReviews();
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		if (!reviews || reviews.length <= 1) {
			if (timelineRef.current) {
				timelineRef.current.kill();
				timelineRef.current = null;
				container.style.transform = '';
			}
			return;
		}

		const cards = container.querySelectorAll('.review-card');
		if (cards.length === 0) return;

		const cardWidth = cards[0].offsetWidth;
		const gap = 24; // 1.5rem gap
		const moveDistance = cardWidth + gap;

		if (timelineRef.current) {
			timelineRef.current.kill();
			timelineRef.current = null;
		}

		const distance = moveDistance * reviews.length;
		const duration = Math.max(1, reviews.length) * 4;

		timelineRef.current = gsap.timeline({ repeat: -1 });
		timelineRef.current.to(container, {
			x: -distance,
			duration,
			ease: "none"
		});
		timelineRef.current.set(container, { x: 0 });

		const handleMouseEnter = () => {
			if (timelineRef.current) timelineRef.current.timeScale(0.2);
		};

		const handleMouseLeave = () => {
			if (timelineRef.current) timelineRef.current.timeScale(1);
		};

		container.addEventListener('mouseenter', handleMouseEnter);
		container.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			if (timelineRef.current) {
				timelineRef.current.kill();
				timelineRef.current = null;
			}
			container.removeEventListener('mouseenter', handleMouseEnter);
			container.removeEventListener('mouseleave', handleMouseLeave);
			container.style.transform = '';
		};
	}, [reviews]);

	const duplicatedReviews = useMemo(() => {
		if (!reviews || reviews.length === 0) return [];
		if (reviews.length === 1) return reviews;
		return [...reviews, ...reviews];
	}, [reviews]);

	return (
		// Section background is white to invert from the dark site theme.
		<section id="reviews" className="w-full overflow-hidden min-h-screen snap-start flex items-center justify-center">
			<div className="max-w-7xl mx-auto px-6 py-12">
				<h2 className="text-3xl sm:text-4xl !font-extrabold mb-6 text-center">
					Ulasan Pelanggan
				</h2>

				{error && (
					<p className="text-center text-sm text-destructive mb-4">{error}</p>
				)}

				{loading && (
					<p className="text-center text-sm text-muted-foreground mb-4">Memuat ulasan...</p>
				)}

				{!loading && !error && reviews.length === 0 && (
					<p className="text-center text-sm text-muted-foreground mb-4">Belum ada ulasan saat ini.</p>
				)}

				{/* Carousel container - allow visible overflow on small screens to avoid clipping scaled cards */}
				<div className="relative overflow-visible px-4 sm:overflow-hidden sm:px-8">
					<div 
						ref={containerRef}
						className="flex gap-6 py-4"
						style={{ willChange: 'transform' }}
					>
						{duplicatedReviews.map((r, index) => (
							<article 
								key={`${r.id}-${index}`} 
								className="review-card flex-shrink-0 w-72 sm:w-80 md:w-96 h-65 transition-transform duration-300 hover:scale-105"
							>
								{/* Card inverted: black background, white text. Wrap in anchor so card is clickable */}
								<a href={r.href} className="block rounded-lg h-full">
									<Card className="h-full shadow-lg flex flex-col overflow-hidden">
										<CardHeader className="flex items-center gap-4">
											<div className="flex items-center gap-3">
												<Avatar>
													<AvatarFallback className="text-white bg-black">
														{r.name
															.split(" ")
															.map((n) => n[0])
															.slice(0, 2)
															.join("")}
													</AvatarFallback>
												</Avatar>
												<div>
													<CardTitle className="text-base md:text-lg font-medium">
														{r.name}
													</CardTitle>
													<Stars value={r.rating} />
													</div>
											</div>
										</CardHeader>

										<CardContent className="flex-1 overflow-hidden">
											<p className="text-base text-black/90">{r.text}</p>
										</CardContent>
									</Card>
								</a>
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}