'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import {
  ArrowRight,
  BarChart3,
  Database,
  PieChart as PieIcon,
  Activity,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

const equityData = [
  { x: 'Jan', y: 1000 },
  { x: 'Feb', y: 1180 },
  { x: 'Mar', y: 1090 },
  { x: 'Apr', y: 1420 },
  { x: 'May', y: 1610 },
  { x: 'Jun', y: 1540 },
  { x: 'Jul', y: 1980 },
  { x: 'Aug', y: 2240 },
];

const strategyData = [
  { name: 'Trend Follow', value: 45, color: '#a78bfa' },
  { name: 'Breakout', value: 30, color: '#34d399' },
  { name: 'Reversal', value: 25, color: '#f472b6' },
];

const metrics = [
  { label: 'Win Rate', value: '68%' },
  { label: 'Profit Factor', value: '2.1' },
  { label: 'Max DD', value: '8.4%' },
];

const brokers = ['Deriv', 'MetaTrader 5', 'Python', 'Supabase'];

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        'rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-black/40 ' +
        className
      }
    >
      {children}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-2xl shadow-black/50 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/80">
          <Activity className="h-4 w-4 text-violet-300" />
          <span className="text-sm font-medium">Equity Curve</span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          +124%
        </span>
      </div>

      <div className="mt-3 h-40 w-full sm:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={equityData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke="#c4b5fd"
              strokeWidth={2.5}
              fill="url(#heroGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5 text-center sm:px-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-white/40 sm:text-xs">{m.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-white sm:text-base">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsCard() {
  return (
    <GlassCard className="z-10 lg:scale-105 lg:-translate-y-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15">
          <BarChart3 className="h-5 w-5 text-violet-300" />
        </div>
        <h3 className="text-base font-semibold text-white">Analytics Engine</h3>
      </div>
      <p className="mb-4 text-sm text-white/50">
        Rolling equity curve with win rate, profit factor and drawdown at a glance.
      </p>
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={equityData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="anaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="y" stroke="#6ee7b7" strokeWidth={2} fill="url(#anaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {metrics.map((m) => (
          <span
            key={m.label}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
          >
            {m.label}: <span className="font-semibold text-white">{m.value}</span>
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

function SyncCard() {
  return (
    <GlassCard className="lg:translate-y-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15">
          <Database className="h-5 w-5 text-sky-300" />
        </div>
        <h3 className="text-base font-semibold text-white">Automated Sync</h3>
      </div>
      <p className="mb-4 text-sm text-white/50">
        Seamless connection to your broker. Trades import automatically — no manual entry.
      </p>
      <ul className="space-y-2.5">
        {['Deriv account linked', 'MT5 history imported', 'Risk metrics computed'].map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-white/75">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            {item}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function StrategyCard() {
  return (
    <GlassCard className="lg:translate-y-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/15">
          <PieIcon className="h-5 w-5 text-pink-300" />
        </div>
        <h3 className="text-base font-semibold text-white">Strategy Edge</h3>
      </div>
      <p className="mb-4 text-sm text-white/50">
        Performance broken down by setup so you know what actually prints.
      </p>
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={strategyData}
                dataKey="value"
                innerRadius={26}
                outerRadius={44}
                paddingAngle={3}
                stroke="none"
              >
                {strategyData.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-1.5 text-sm">
          {strategyData.map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-white/75">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
              <span className="text-white/40">· {s.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}

export function HomeContent() {
  return (
    <div className="dark overflow-x-hidden">
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(0, 0, 30)"
        gradientBackgroundEnd="rgb(0, 0, 0)"
        firstColor="0, 150, 255"
        secondColor="255, 0, 150"
        thirdColor="0, 255, 200"
        fourthColor="255, 100, 0"
        fifthColor="150, 0, 255"
        pointerColor="255, 255, 255"
        size="80%"
        blendingValue="hard-light"
        containerClassName="min-h-screen! h-auto! w-full! max-w-full! overflow-x-hidden!"
        className="min-h-screen! h-auto!"
      >
        <div className="relative z-10 min-h-screen w-full max-w-full overflow-x-hidden">
          {/* Navigation */}
          <header className="container mx-auto flex items-center justify-between px-4 py-5">
            <Link href="/" className="text-xl font-light tracking-[0.14em] text-white">
              TempoTrades
            </Link>
            <nav className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm text-white/70 transition-colors hover:text-white">
                Features
              </a>
              <a href="#features" className="text-sm text-white/70 transition-colors hover:text-white">
                Analytics
              </a>
              <a href="#features" className="text-sm text-white/70 transition-colors hover:text-white">
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-white text-black hover:bg-white/90">
                  Sign Up
                </Button>
              </Link>
            </div>
          </header>

          {/* Hero */}
          <section className="container mx-auto px-4 pb-16 pt-12 text-center md:pt-20">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              AI-powered mechanical trading journal
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Precision Trading <span className="text-white/50">Journal</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/60 md:text-lg">
              Stop journaling trades by hand. Connect your Deriv account and let the platform do
              the math.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group h-12 bg-white px-8 text-base font-semibold text-black hover:bg-white/90"
                >
                  Start Journaling
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Visual centerpiece */}
            <div className="mt-14">
              <DashboardPreview />
            </div>
          </section>

          {/* Features */}
          <section id="features" className="container mx-auto px-4 py-16">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-white md:text-4xl">Included Features</h2>
              <p className="mt-3 text-white/50">
                Everything you need to review, analyze and sharpen your edge.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
              <SyncCard />
              <AnalyticsCard />
              <StrategyCard />
            </div>
          </section>

          {/* Trust bar */}
          <footer className="container mx-auto px-4 py-12">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-white/30">
              Supported brokers &amp; tech
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {brokers.map((b) => (
                <span key={b} className="text-lg font-medium text-white/35 transition-colors hover:text-white/60">
                  {b}
                </span>
              ))}
            </div>
            <p className="mt-10 text-center text-xs text-white/30">
              © {new Date().getFullYear()} TempoTrades. Built for serious traders.
            </p>
          </footer>
        </div>
      </BackgroundGradientAnimation>
    </div>
  );
}
