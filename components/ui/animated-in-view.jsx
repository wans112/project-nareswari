"use client";

import { createElement } from "react";

import { cn } from "@/lib/utils";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";

export function AnimatedInView({
	as,
	className,
	threshold,
	rootMargin,
	once,
	children,
	...props
}) {
	const { ref, phase } = useInViewAnimation({ threshold, rootMargin, once });
	const animationClass =
		phase === "entering"
			? "animate-fade-in-up"
			: phase === "leaving"
				? "animate-fade-out-down"
				: "";
	const Component = as ?? "div";

	return createElement(
		Component,
		{
			ref,
			className: cn("fade-will-animate", animationClass, className),
			...props,
		},
		children
	);
}
