import {
	Activity,
	ArrowUpRight,
	Bell,
	ChevronRight,
	CircleAlert,
	Gauge,
	Layers3,
	MapPinned,
	PlugZap,
	Search,
	SlidersHorizontal,
	Sparkles,
	TriangleAlert,
	Zap,
} from "lucide-react";

type Tone = "primary" | "muted";

const loadBars = [18, 25, 31, 49, 42, 57, 39, 34, 45, 63, 54, 41, 60, 76, 52, 83, 47, 36];
const peakBarIndex = loadBars.indexOf(Math.max(...loadBars));

const activityItems = [
	{ title: "Session Started", detail: "Node NYC-HUB-07 - Port 3", time: "Just now", tone: "primary" },
	{ title: "Session Completed", detail: "Node NYC-HUB-01 - Port 1", time: "4m ago", tone: "muted" },
	{ title: "Session Started", detail: "Node NYC-HUB-08 - Port 6", time: "12m ago", tone: "primary" },
	{ title: "Session Completed", detail: "Node BOS-CTR-02 - Port 2", time: "22m ago", tone: "muted" },
] satisfies Array<{ title: string; detail: string; time: string; tone: Tone }>;

const systemRows = [
	{ label: "Database", value: "Active" },
	{ label: "Inverters", value: "94/96" },
	{ label: "Grid sync", value: "Stable" },
];

const networkStats = [
	{ label: "Peak load", value: "1.2 MW" },
	{ label: "Avg session", value: "42 Min" },
	{ label: "Efficiency", value: "98.4%" },
	{ label: "Revenue/hr", value: "$4,280" },
];

function ToneDot({ tone }: { tone: Tone }) {
	return (
		<span
			className={tone === "primary" ? "h-2.5 w-2.5 rounded-full bg-white" : "h-2.5 w-2.5 rounded-full bg-white/30"}
			aria-hidden
		/>
	);
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={`rounded-[1.15rem] border border-white/10 bg-[#1a1a1c] shadow-[0_18px_50px_rgba(0,0,0,0.45)] ${className}`}>
			{children}
		</div>
	);
}

export default function OperationalDashboard() {
	return (
		<div className="relative overflow-hidden rounded-[1.5rem] bg-[#090909] text-white">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_20%)]" />
			<div className="relative space-y-4 p-0">
				<section className="grid gap-4 xl:grid-cols-3">
					<Panel className="p-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">Live power draw</p>
								<div className="mt-3 flex items-end gap-2">
									<div className="text-4xl font-semibold tracking-tight">842.4</div>
									<div className="pb-1 text-sm font-medium text-white/55">kW</div>
								</div>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-white/80">
								<Zap className="h-4 w-4" aria-hidden />
							</div>
						</div>
						<div className="mt-8 h-1.5 rounded-full bg-white/10">
							<div className="h-full w-[72%] rounded-full bg-white" />
						</div>
						<p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-white/35">+12% vs last hour</p>
					</Panel>

					<Panel className="p-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">Network occupancy</p>
								<div className="mt-3 flex items-end gap-2">
									<div className="text-4xl font-semibold tracking-tight">128</div>
									<div className="pb-1 text-sm font-medium text-white/45">/150</div>
								</div>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-white/80">
								<PlugZap className="h-4 w-4" aria-hidden />
							</div>
						</div>
						<div className="mt-7 grid grid-cols-[auto_1fr_auto] items-end gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
							<div className="space-y-2">
								<div>Available</div>
								<div className="h-1.5 w-12 rounded-full bg-white/15"><div className="h-full w-[22%] rounded-full bg-white/30" /></div>
							</div>
							<div className="flex items-center justify-between text-[10px] text-white/55">
								<span>22</span><span>In use</span><span>128</span>
							</div>
							<div className="space-y-2 text-right">
								<div>In use</div>
								<div className="h-1.5 w-20 rounded-full bg-white/15"><div className="h-full w-[94%] rounded-full bg-white" /></div>
							</div>
						</div>
					</Panel>

					<Panel className="p-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">Active alerts</p>
								<div className="mt-3 flex items-end gap-2">
									<div className="text-4xl font-semibold tracking-tight">03</div>
									<div className="pb-2 text-white/70">•</div>
								</div>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black">
								<TriangleAlert className="h-4 w-4" aria-hidden />
							</div>
						</div>
						<div className="mt-5 rounded-lg border border-white/12 bg-white/4 p-3 text-[11px] uppercase tracking-[0.18em] text-white/80">
							Terminal 48 inverter thermal threshold warning
						</div>
					</Panel>
				</section>

				<section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
					<Panel className="overflow-hidden p-0">
						<div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5">
							<div>
								<h2 className="text-xl font-medium tracking-tight">Network Load Distribution</h2>
								<p className="mt-1 text-sm text-white/40">Real-time aggregate consumption across all active terminals.</p>
							</div>
							<div className="flex items-center rounded-full border border-white/8 bg-white/3 p-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">
								<span className="rounded-full bg-white px-3 py-1.5 text-black">Live</span>
								<span className="px-3 py-1.5">24h</span>
							</div>
						</div>
						<div className="border-b border-white/8 px-5 py-5">
							<div className="relative flex h-82.5 items-end gap-2 rounded-[1.25rem] bg-[#111113] px-4 pb-4 pt-8">
								{loadBars.map((height, index) => {
									const isPeak = index === peakBarIndex;
									const barClass = isPeak
										? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
										: index % 5 === 0
											? "bg-white/70"
											: index % 3 === 0
												? "bg-white/45"
												: "bg-white/18";
									return (
										<div key={`${height}-${index}`} className="relative flex flex-1 items-end">
											{isPeak ? (
												<div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-black shadow-lg whitespace-nowrap">
													Peak
												</div>
											) : null}
											<div
												className={`w-full rounded-t-md transition-all ${barClass}`}
												style={{ height: `${height}%` }}
												aria-hidden
											/>
										</div>
									);
								})}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
							{networkStats.map((item) => (
								<div key={item.label} className="border-r border-white/8 px-5 py-5 last:border-r-0">
									<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/35">{item.label}</p>
									<p className="mt-3 text-lg font-semibold">{item.value}</p>
								</div>
							))}
						</div>
					</Panel>

					<Panel className="p-5">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2 className="text-xl font-medium tracking-tight">Live Activity</h2>
								<p className="mt-1 text-sm text-white/40">Real-time session updates</p>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-white/75">
								<Activity className="h-4 w-4" aria-hidden />
							</div>
						</div>

						<div className="mt-6 space-y-5">
						{activityItems.map((item, index) => (
							<div key={index} className="border-l border-white/8 pl-4">
									<div className="flex items-start gap-3">
										<ToneDot tone={item.tone} />
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-3">
												<p className="text-sm font-semibold">{item.title}</p>
												<span className="text-xs text-white/35">{item.time}</span>
											</div>
											<p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">{item.detail}</p>
										</div>
									</div>
								</div>
							))}
						</div>

						<div className="mt-5 rounded-[1rem] border border-white/10 bg-white/4 p-4">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-white/75">
									<CircleAlert className="h-4 w-4" aria-hidden />
								</div>
								<div>
									<p className="text-sm font-semibold">Diagnostic Event</p>
									<p className="mt-1 text-sm text-white/45">High latency detected on Node S-F-120. Automatic recovery engaged.</p>
								</div>
							</div>
						</div>

						<button className="mt-5 flex w-full items-center justify-center gap-2 rounded-[0.9rem] border border-white/10 bg-white/3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition hover:bg-white/6">
							View all activities
							<ChevronRight className="h-3.5 w-3.5" aria-hidden />
						</button>
					</Panel>
				</section>

				<section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.55fr)_minmax(200px,0.4fr)]">
					<Panel className="overflow-hidden p-0">
						<div className="relative min-h-52.5 overflow-hidden bg-[linear-gradient(180deg,#121214,#0d0d0f)] p-5">
							<div className="absolute inset-0 opacity-70 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[26px_26px]" />
							<div className="relative flex h-full min-h-42.5 flex-col justify-between">
								<div>
									<h2 className="text-xl font-medium tracking-tight">Active Nodes</h2>
									<p className="mt-1 text-sm text-white/40">Regional Cluster: Northeast Corridor</p>
								</div>
								<div className="flex gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
									<div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
										<p className="text-[9px] text-white/35">SF Bay Area</p>
										<p className="mt-1 text-sm text-white">42 Active</p>
									</div>
									<div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
										<p className="text-[9px] text-white/35">NYC Metro</p>
										<p className="mt-1 text-sm text-white">108 Active</p>
									</div>
								</div>
							</div>
						</div>
					</Panel>

					<Panel className="p-5">
						<div className="flex h-full flex-col items-center justify-center text-center">
							<div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/14 bg-black/35">
								<div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 text-2xl font-semibold">75%</div>
							</div>
							<p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">Fleet Health Index</p>
							<p className="mt-2 max-w-[18ch] text-sm text-white/45">Optimal operating conditions across 12 clusters.</p>
						</div>
					</Panel>

					<Panel className="p-5">
						<div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">System Uptime</div>
						<div className="mt-3 text-3xl font-semibold tracking-tight">99.998%</div>
						<div className="mt-6 space-y-4">
							{systemRows.map((row) => (
								<div key={row.label} className="flex items-center justify-between gap-3 text-sm">
									<span className="text-white/45">{row.label}</span>
									<span className="font-semibold">{row.value}</span>
								</div>
							))}
						</div>
						<button className="mt-6 flex w-full items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/3 px-4 py-3 text-sm font-semibold transition hover:bg-white/6">
							Details
						</button>
					</Panel>
				</section>
			</div>
		</div>
	);
}
