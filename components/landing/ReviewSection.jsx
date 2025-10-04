"use client"

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import 'bootstrap-icons/font/bootstrap-icons.css';

const reviews = [
	{
		id: 1,
		href: 'https://maps.app.goo.gl/ZeaUAk1S4Xs8QYyw9',
		name: "Chica Rohaetun",
		rating: 5,
		text: "Suka banget sama pelayananya orang² nya juga ramah² , hasil make up nya juga bagus bikin pangling, semoga makin sukses yah kakk",
	},
	{
		id: 2,
		href: '/testimonials/2',
		name: "Budi Santoso",
		rating: 4,
		text: "Tim profesional dan ramah — koordinasi mudah. Beberapa detail minor, tapi keseluruhan sangat baik.",
	},
	{
		id: 3,
		href: '/testimonials/3',
		name: "Ayu Lestari",
		rating: 5,
		text: "Dekorasi sesuai tema, fotografer juga merekomendasikan tata pencahayaan. Sangat puas!",
	},
	{
		id: 4,
		href: '/testimonials/4',
		name: "Rudi Wijaya",
		rating: 4,
		text: "Hasil foto preweddingnya luar biasa, lokasi dan stylingnya pas. Timnya juga sangat profesional.",
	},
	{
		id: 5,
		href: '/testimonials/5',
		name: "Dewi Kartika",
		rating: 5,
		text: "Make up natural dan tahan lama, persis seperti yang saya inginkan. Timnya sangat perhatian dan detail.",
	},
	{
		id: 6,
		href: '/testimonials/6',
		name: "Ahmad Maulana",
		rating: 4,
		text: "Paket lengkap dengan harga bersaing. Beberapa penyesuaian di hari H, tapi hasil akhirnya memuaskan.",
	},
	{
		id: 7,
		href: '/testimonials/7',
		name: "Lina Marlina",
		rating: 5,
		text: "Sangat direkomendasikan untuk dekorasi pernikahan. Timnya kreatif dan sangat membantu dalam proses perencanaan.",
	},
];

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

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const cards = container.querySelectorAll('.review-card');
		if (cards.length === 0) return;

		const cardWidth = cards[0].offsetWidth;
		const gap = 24; // 1.5rem gap
		const moveDistance = cardWidth + gap;

		// Create infinite scroll animation
		const createAnimation = () => {
			timelineRef.current = gsap.timeline({ repeat: -1 });
			
			timelineRef.current.to(container, {
				x: -moveDistance * reviews.length,
				duration: reviews.length * 4, // 4 seconds per card
				ease: "none"
			});

			timelineRef.current.set(container, { x: 0 });
		};

		createAnimation();

		// Slow down on hover (instead of pausing)
		const handleMouseEnter = () => {
			if (timelineRef.current) {
				// slow to 20% speed
				timelineRef.current.timeScale(0.2);
			}
		};

		const handleMouseLeave = () => {
			if (timelineRef.current) {
				// restore normal speed
				timelineRef.current.timeScale(1);
			}
		};

		container.addEventListener('mouseenter', handleMouseEnter);
		container.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			if (timelineRef.current) {
				timelineRef.current.kill();
			}
			container.removeEventListener('mouseenter', handleMouseEnter);
			container.removeEventListener('mouseleave', handleMouseLeave);
		};
	}, []);

	// Create duplicated reviews for seamless loop
	const duplicatedReviews = [...reviews, ...reviews];

	return (
		// Section background is white to invert from the dark site theme.
		<section id="reviews" className="w-full overflow-hidden min-h-screen snap-start flex items-center justify-center">
			<div className="max-w-7xl mx-auto px-6 py-12">
				<h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-center">
					Ulasan Pelanggan
				</h2>

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