"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
export default function CategoriesSection({ initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    setCategories(Array.isArray(initialCategories) ? initialCategories : []);
  }, [initialCategories]);

  const hasCategories = Array.isArray(categories) && categories.length > 0;

  return (
    <section id="packages" className="w-full min-h-screen flex items-center bg-white text-black snap-start">
      <div className="max-w-7xl mx-auto px-6 pt-2 pb-8 w-full">
        <h2 className="text-3xl sm:text-4xl !font-extrabold text-center">Layanan</h2>
        {/* Mobile: carousel (visible on screens smaller than sm) */}
        <div className="mt-6 relative sm:hidden">
          {hasCategories ? (
            <Carousel opts={{ containScroll: 'trimSnaps' }} className="w-full">
              <CarouselContent className="p-4">
                {categories.map((c) => (
                  <CarouselItem key={c.id ?? c.href} className="min-w-[18rem] md:min-w-[20rem] lg:min-w-[14rem]">
                    <Link href={c.href} className="block w-full h-full no-underline">
                      <Card className="h-full p-4 border-2 hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">{c.label}</CardTitle>
                          <CardDescription>{/* optional small label */}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-base text-muted-foreground">{c.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <p className="text-center text-muted-foreground py-10">Belum ada kategori tersedia.</p>
          )}
        </div>

        {/* Desktop / Tablet: 3-column grid starting at sm */}
        <div className="mt-6 hidden sm:block">
          {hasCategories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((c, i) => {
                const delays = ["0s", "0.6s", "0.3s", "0.9s", "0.45s", "0.15s", "0.75s"];
                const durations = ["4s", "4.5s", "3.8s", "5s", "4.2s", "3.6s", "4.8s"];
                const style = { animationDelay: delays[i % delays.length], animationDuration: durations[i % durations.length] };

                return (
                  <Link key={c.id ?? c.href ?? i} href={c.href} className="block w-full h-full no-underline">
                    <Card style={style} className="h-full p-4 border-2 hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out card-float">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">{c.label}</CardTitle>
                        <CardDescription>{/* optional small label */}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-base text-muted-foreground">{c.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Belum ada kategori tersedia.</p>
          )}
        </div>
      </div>
    </section>
  );
}
