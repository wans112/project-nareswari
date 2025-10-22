"use client";

import { useEffect, useRef, useState } from "react";

const IDLE = "idle";
const ENTERING = "entering";
const LEAVING = "leaving";

export function useInViewAnimation({
	threshold = 0.2,
	rootMargin = "0px 0px -10% 0px",
	once = false,
} = {}) {
	const ref = useRef(null);
	const [phase, setPhase] = useState(IDLE);
	const hasEnteredRef = useRef(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
			setPhase(ENTERING);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					hasEnteredRef.current = true;
					setPhase(ENTERING);
					if (once) observer.unobserve(entry.target);
				} else if (!once || !hasEnteredRef.current) {
					setPhase(LEAVING);
				}
			},
			{ threshold, rootMargin }
		);

		observer.observe(node);

		return () => observer.disconnect();
	}, [threshold, rootMargin, once]);

	return { ref, phase };
}
