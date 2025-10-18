"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Line } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Tooltip as ChartJsTooltip,
	Legend,
	Filler,
} from "chart.js";
import {
	Table,
	TableHeader,
	TableHead,
	TableRow,
	TableBody,
	TableCell,
	TableCaption,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Clock3,
	FileText,
	Globe2,
	RefreshCw,
	Search,
	TrendingUp,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartJsTooltip, Legend, Filler);

const TIMEFRAMES = [
	{ label: "24 Jam Terakhir", value: "1 day" },
	{ label: "7 Hari Terakhir", value: "7 days" },
	{ label: "30 Hari Terakhir", value: "30 days" },
	{ label: "Semua Waktu", value: "all" },
];

const numberFormatter = new Intl.NumberFormat("id-ID");
const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatNumber(value) {
	return numberFormatter.format(Math.max(0, Number(value) || 0));
}

function formatDateTime(value) {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return dateTimeFormatter.format(date);
}

function formatTimeAgo(value) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	const diffMs = Date.now() - date.getTime();
	if (diffMs < 0) return "Sebentar lagi";
	const diffMinutes = Math.floor(diffMs / 60000);
	if (diffMinutes < 1) return "Baru saja";
	if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours} jam lalu`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays} hari lalu`;
	const diffWeeks = Math.floor(diffDays / 7);
	if (diffWeeks < 5) return `${diffWeeks} minggu lalu`;
	const diffMonths = Math.floor(diffDays / 30);
	if (diffMonths < 12) return `${diffMonths} bulan lalu`;
	const diffYears = Math.floor(diffDays / 365);
	return `${diffYears} tahun lalu`;
}

function extractHost(value) {
	if (!value) return "Langsung";
	try {
		const host = new URL(value).hostname.replace(/^www\./, "");
		return host || "Langsung";
	} catch (_) {
		return value.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") || "Lainnya";
	}
}

function formatPathLabel(path) {
	if (!path || typeof path !== "string") return "-";
	const trimmed = path.trim();
	if (!trimmed || trimmed === "/") return "landing-page";
	if (!trimmed.startsWith("/")) return trimmed;
	const segments = trimmed.split("/").filter(Boolean);
	if (segments.length === 1) {
		return `layanan-${segments[0]}`;
	}
	return segments.join("/");
}

function SummaryCard({ title, value, description, icon: Icon, loading }) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				{Icon ? <Icon className="text-muted-foreground size-4" /> : null}
			</CardHeader>
			<CardContent className="space-y-1 pb-6 pt-0">
				{loading ? (
					<Skeleton className="h-6 w-24" />
				) : (
					<div className="text-2xl font-semibold tracking-tight">{value}</div>
				)}
				{description ? (
					loading ? (
						<Skeleton className="h-4 w-32" />
					) : (
						<p className="text-xs text-muted-foreground">{description}</p>
					)
				) : null}
			</CardContent>
		</Card>
	);
}

export default function StatistikAdmin() {
	const [timeframe, setTimeframe] = useState("7 days");
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [refreshTick, setRefreshTick] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [stats, setStats] = useState({ recent: [], topPages: [], list: null });

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query.trim());
		}, 350);
		return () => clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		const controller = new AbortController();
		let active = true;

		async function load() {
			setLoading(true);
			setError(null);
			try {
				const params = new URLSearchParams();
				if (timeframe !== "all") params.set("since", timeframe);
				if (debouncedQuery) params.set("q", debouncedQuery);
				const url = params.size ? `/api/track?${params.toString()}` : "/api/track";
				const res = await fetch(url, { cache: "no-store", signal: controller.signal });
				if (!res.ok) throw new Error(`Gagal memuat statistik (${res.status})`);
				const json = await res.json();
				if (!active) return;
				setStats({
					recent: Array.isArray(json?.recent) ? json.recent : [],
					topPages: Array.isArray(json?.topPages) ? json.topPages : [],
					list: Array.isArray(json?.list) ? json.list : null,
				});
			} catch (err) {
				if (err?.name === "AbortError") return;
				if (active) setError(err?.message || "Terjadi kesalahan saat memuat statistik");
			} finally {
				if (active) setLoading(false);
			}
		}

		load();
		return () => {
			active = false;
			controller.abort();
		};
	}, [timeframe, debouncedQuery, refreshTick]);

	const timeframeLabel = useMemo(
		() => TIMEFRAMES.find((item) => item.value === timeframe)?.label ?? "Semua Waktu",
		[timeframe]
	);

	const displayRecent = useMemo(
		() => (debouncedQuery ? stats.list ?? [] : stats.recent),
		[debouncedQuery, stats.list, stats.recent]
	);

	const topPagesToDisplay = useMemo(
		() => stats.topPages.slice(0, 5),
		[stats.topPages]
	);

	const recentTableItems = useMemo(
		() => displayRecent.slice(0, 10),
		[displayRecent]
	);

	const totalViews = useMemo(
		() => stats.topPages.reduce((acc, item) => acc + (Number(item?.views) || 0), 0),
		[stats.topPages]
	);
	const bestPageRaw = stats.topPages[0]?.path || null;
	const bestPageLabel = bestPageRaw ? formatPathLabel(bestPageRaw) : "Belum ada";
	const bestPageViews = stats.topPages[0]?.views || 0;

	const uniqueSources = useMemo(() => {
		const set = new Set();
		displayRecent.forEach((item) => {
			if (item?.hostname) set.add(item.hostname);
			else if (item?.ip) set.add(item.ip);
		});
		return set.size;
	}, [displayRecent]);

	const lastVisit = displayRecent[0]?.created_at ?? null;
	const lastVisitRelative = formatTimeAgo(lastVisit);

	const topLanguages = useMemo(() => {
		const store = new Map();
		displayRecent.forEach((item) => {
			const lang = item?.lang?.trim();
			if (!lang) return;
			const key = lang.toLowerCase();
			store.set(key, (store.get(key) || 0) + 1);
		});
		return Array.from(store.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	}, [displayRecent]);

	const topReferrers = useMemo(() => {
		const store = new Map();
		displayRecent.forEach((item) => {
			const label = extractHost(item?.referrer || "");
			store.set(label, (store.get(label) || 0) + 1);
		});
		return Array.from(store.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	}, [displayRecent]);

	const totalEntries = displayRecent.length || 1;
	const searchActive = Boolean(debouncedQuery);

	const chartData = useMemo(() => {
		const source = Array.isArray(stats.recent) ? stats.recent : [];
		const buckets = new Map();
		const isHourly = timeframe === "1 day";
		for (const item of source) {
			const ts = item?.created_at ? Date.parse(item.created_at) : NaN;
			if (Number.isNaN(ts)) continue;
			const date = new Date(ts);
			let bucketKey;
			let label;
			let orderStamp;
			if (isHourly) {
				const bucketDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
				bucketKey = bucketDate.toISOString();
				label = `${String(date.getHours()).padStart(2, "0")}:00`;
				orderStamp = bucketDate.getTime();
			} else {
				const bucketDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
				bucketKey = bucketDate.toISOString();
				label = date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
				orderStamp = bucketDate.getTime();
			}
			if (!buckets.has(bucketKey)) {
				buckets.set(bucketKey, { label, views: 1, orderStamp });
			} else {
				buckets.get(bucketKey).views += 1;
			}
		}
		return Array.from(buckets.values())
			.sort((a, b) => a.orderStamp - b.orderStamp)
			.map(({ label, views }) => ({ period: label, views }));
	}, [stats.recent, timeframe]);

	const lineChartData = useMemo(() => ({
		labels: chartData.map((item) => item.period),
		datasets: [
			{
				label: "Kunjungan",
				data: chartData.map((item) => item.views),
				borderColor: "rgba(59, 130, 246, 1)",
				backgroundColor: "rgba(59, 130, 246, 0.15)",
				fill: true,
				tension: 0.35,
				pointRadius: 3,
				pointHoverRadius: 5,
			},
		],
	}), [chartData]);

	const lineChartOptions = useMemo(() => ({
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			mode: "index",
			intersect: false,
		},
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (context) => {
						const value = context.parsed?.y ?? 0;
						return `${formatNumber(value)} kunjungan`;
					},
				},
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { maxRotation: 0 },
			},
			y: {
				beginAtZero: true,
				grid: { color: "rgba(148, 163, 184, 0.25)" },
				ticks: { precision: 0 },
			},
		},
		layout: {
			padding: { top: 4, right: 8, bottom: 0, left: 0 },
		},
	}), []);

	const summaryItems = [
		{
			title: "Total Kunjungan",
			value: formatNumber(totalViews),
			description: `Rentang ${timeframeLabel.toLowerCase()}`,
			icon: TrendingUp,
		},
		{
			title: "Halaman Terpopuler",
			value: bestPageLabel,
			description: bestPageRaw
				? `${formatNumber(bestPageViews)} kali dilihat • ${bestPageRaw}`
				: undefined,
			icon: FileText,
		},
		{
			title: "Sumber Unik",
			value: formatNumber(uniqueSources),
			description: "Hostname atau IP berbeda",
			icon: Globe2,
		},
		{
			title: "Aktivitas Terakhir",
			value: lastVisitRelative ?? "Belum ada",
			description: lastVisit ? formatDateTime(lastVisit) : undefined,
			icon: Clock3,
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl !font-bold tracking-tight">Statistik Pengunjung</h2>
					<p className="text-muted-foreground text-sm">
						{searchActive
							? `Menampilkan ${formatNumber(displayRecent.length)} kunjungan untuk "${debouncedQuery}"`
							: `Ringkasan kunjungan dalam rentang ${timeframeLabel.toLowerCase()}.`}
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<div className="relative w-full sm:w-[220px]">
						<Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
						<Input
							placeholder="Cari path (mis. /produk)"
							className="pl-9"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</div>
					<Select value={timeframe} onValueChange={setTimeframe}>
						<SelectTrigger size="sm" className="sm:w-[190px]">
							<SelectValue placeholder="Pilih rentang" />
						</SelectTrigger>
						<SelectContent align="end">
							{TIMEFRAMES.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setRefreshTick((count) => count + 1)}
						disabled={loading}
					>
						<RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
						Segarkan
					</Button>
				</div>
			</div>

			{error ? (
				<Alert variant="destructive">
					<AlertTitle>Gagal memuat data</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{summaryItems.map((item) => (
					<SummaryCard key={item.title} loading={loading} {...item} />
				))}
			</div>

			<Card>
				<CardHeader className="pb-0">
					<CardTitle>Tren Kunjungan</CardTitle>
					<CardDescription>
						Perubahan jumlah kunjungan berdasarkan waktu dalam rentang {timeframeLabel.toLowerCase()}.
					</CardDescription>
				</CardHeader>
				<CardContent className="pb-6 pt-4">
					{loading ? (
						<Skeleton className="h-[240px] w-full" />
					) : chartData.length ? (
						<div className="h-[260px] w-full">
							<Line data={lineChartData} options={lineChartOptions} />
						</div>
					) : (
						<p className="text-muted-foreground text-sm">Belum ada data untuk ditampilkan sebagai grafik.</p>
					)}
				</CardContent>
			</Card>

			<div className="grid gap-4 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader className="pb-0">
						<CardTitle>Halaman Terpopuler</CardTitle>
						<CardDescription>
							{stats.topPages.length
								? `Halaman dengan kunjungan terbanyak dalam rentang ${timeframeLabel.toLowerCase()}.`
								: "Belum ada data yang dapat ditampilkan."}
						</CardDescription>
					</CardHeader>
					<CardContent className="px-0 pb-6 pt-4">
						<div className="px-6">
							<Badge variant="outline">{timeframeLabel}</Badge>
						</div>
						<div className="px-6 pt-4">
							{loading ? (
								<div className="space-y-3">
									{Array.from({ length: 4 }).map((_, idx) => (
										<Skeleton key={idx} className="h-9 w-full" />
									))}
								</div>
							) : stats.topPages.length ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Path</TableHead>
											<TableHead>Tampilan</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{topPagesToDisplay.map((item) => (
											<TableRow key={item.path}>
												<TableCell>
													<div className="flex flex-col leading-tight">
														<span className="font-medium">{formatPathLabel(item.path)}</span>
														<span className="text-muted-foreground text-xs">{item.path}</span>
													</div>
												</TableCell>
												<TableCell>{formatNumber(item.views)}</TableCell>
											</TableRow>
										))}
									</TableBody>
									<TableCaption>Top 5 halaman berdasarkan jumlah kunjungan.</TableCaption>
								</Table>
							) : (
								<p className="text-muted-foreground px-1 text-sm">Belum ada data kunjungan untuk periode ini.</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-0">
						<CardTitle>Bahasa & Sumber</CardTitle>
						<CardDescription>Statistik dari {formatNumber(displayRecent.length)} kunjungan terbaru.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6 pb-6 pt-4">
						<div>
							<h4 className="text-sm font-medium">Bahasa Teratas</h4>
							{loading ? (
								<div className="mt-3 space-y-2">
									{Array.from({ length: 3 }).map((_, idx) => (
										<Skeleton key={idx} className="h-6 w-full" />
									))}
								</div>
							) : topLanguages.length ? (
								<ul className="mt-3 space-y-2">
									{topLanguages.map(([lang, count]) => (
										<li key={lang} className="flex items-center justify-between text-sm">
											<span className="flex items-center gap-2">
												<Badge variant="outline" className="uppercase">
													{lang}
												</Badge>
												<span className="text-muted-foreground text-xs">
													{Math.round((count / totalEntries) * 100)}%
												</span>
											</span>
											<span className="font-semibold">{formatNumber(count)}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-muted-foreground mt-3 text-xs">Belum ada data bahasa.</p>
							)}
						</div>

						<div>
							<h4 className="text-sm font-medium">Referrer Teratas</h4>
							{loading ? (
								<div className="mt-3 space-y-2">
									{Array.from({ length: 3 }).map((_, idx) => (
										<Skeleton key={idx} className="h-6 w-full" />
									))}
								</div>
							) : topReferrers.length ? (
								<ul className="mt-3 space-y-2">
									{topReferrers.map(([host, count]) => (
										<li key={host} className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground truncate pr-4">{host}</span>
											<span className="font-semibold">{formatNumber(count)}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-muted-foreground mt-3 text-xs">Belum ada data referrer.</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="pb-0">
					<CardTitle>Kunjungan Terbaru</CardTitle>
					<CardDescription>
						{searchActive
							? `Hasil filter untuk "${debouncedQuery}"`
							: `Mencatat ${formatNumber(displayRecent.length)} kunjungan terbaru.`}
					</CardDescription>
				</CardHeader>
				<CardContent className="px-0 pb-6 pt-4">
					{loading ? (
						<div className="space-y-3 px-6">
							{Array.from({ length: 6 }).map((_, idx) => (
								<Skeleton key={idx} className="h-10 w-full" />
							))}
						</div>
					) : displayRecent.length ? (
						<div className="px-6">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Path</TableHead>
										<TableHead>Hostname</TableHead>
										<TableHead>Referrer</TableHead>
										<TableHead>Bahasa</TableHead>
										<TableHead>IP</TableHead>
										<TableHead>Waktu</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{recentTableItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell>
												<div className="flex flex-col leading-tight">
													<span className="font-medium">{formatPathLabel(item.path)}</span>
													<span className="text-muted-foreground text-xs">{item.path}</span>
												</div>
											</TableCell>
											<TableCell>{item.hostname || "—"}</TableCell>
											<TableCell className="max-w-[160px] truncate" title={item.referrer || "—"}>
												{item.referrer || "—"}
											</TableCell>
											<TableCell>{item.lang ? item.lang.toUpperCase() : "—"}</TableCell>
											<TableCell>{item.ip || "—"}</TableCell>
											<TableCell>{formatDateTime(item.created_at)}</TableCell>
										</TableRow>
									))}
								</TableBody>
								<TableCaption>Kunjungan terbaru dibatasi 10 entri.</TableCaption>
							</Table>
						</div>
					) : (
						<p className="text-muted-foreground px-6 text-sm">Belum ada kunjungan yang tercatat.</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
