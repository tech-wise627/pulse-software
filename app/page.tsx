'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Activity, MapPin, Users, TrendingUp, Shield, ChevronRight } from 'lucide-react';

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<2s', label: 'Alert Latency' },
  { value: '10k+', label: 'Bins Tracked' },
  { value: '60%', label: 'Waste Reduction' },
];

const features = [
  {
    icon: Activity,
    title: 'Live Bin Monitoring',
    desc: 'IoT-connected sensors report fill levels, tilt events, and battery status in real time across your entire site.',
  },
  {
    icon: MapPin,
    title: 'Zone & Ground Mapping',
    desc: 'Draw operational zones on a live map. Assign staff to zones and track coverage with a visual command view.',
  },
  {
    icon: Users,
    title: 'Staff Operations',
    desc: 'Deploy cleaning teams, track worker locations against event boundaries, and manage shift assignments.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    desc: 'PULSE learns from historical data to predict bin fill rates and optimize resource deployment before issues arise.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Granular access control for Admin, Manager, HR, and Staff — everyone sees exactly what they need.',
  },
  {
    icon: Zap,
    title: 'Instant Alerts',
    desc: 'Critical alerts for full bins, offline devices, and out-of-bounds workers reach the right people immediately.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080C10] text-white antialiased">

      {/* ── Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080C10]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#00FF9C] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">PULSE</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors duration-200">Features</a>
            <a href="#about" className="text-sm text-white/50 hover:text-white transition-colors duration-200">About</a>
          </nav>
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-sm font-medium text-[#00FF9C] hover:opacity-80 transition-opacity"
          >
            Sign in <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-40 pb-28 px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient light */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-[0.07] bg-[#00FF9C] blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00FF9C]/20 bg-[#00FF9C]/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
            <span className="text-xs font-medium text-[#00FF9C] tracking-wide uppercase">Smart Waste Intelligence Platform</span>
          </div>

          <h1 className="text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-[1.05] tracking-tight mb-6">
            Waste management,{' '}
            <span className="text-[#00FF9C]">finally intelligent.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-10">
            PULSE gives event operators, campuses, and public venues a real-time command view of every bin, every worker, and every zone — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#00FF9C] text-black text-sm font-semibold rounded-lg hover:bg-[#00FF9C]/90 transition-colors"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white/5 text-white/80 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="max-w-3xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-px border border-white/8 rounded-xl overflow-hidden bg-white/5">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#0D1117] px-6 py-6 text-center">
              <div className="text-2xl font-bold text-[#00FF9C]">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-14">
            <p className="text-xs text-[#00FF9C] font-semibold uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">Built for operations at scale</h2>
            <p className="text-white/50 mt-4 text-lg leading-relaxed">
              Every feature is designed around what field teams and operations managers actually need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#00FF9C]/20 transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-[#00FF9C]/10 flex items-center justify-center mb-4 group-hover:bg-[#00FF9C]/20 transition-colors">
                  <f.icon className="w-4.5 h-4.5 text-[#00FF9C]" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product callout ── */}
      <section id="about" className="py-24 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#0D1117] to-[#080C10] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Text side */}
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <p className="text-xs text-[#00FF9C] font-semibold uppercase tracking-widest mb-4">PULSE Intelligence</p>
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-5">
                  Predict waste before it becomes a problem.
                </h2>
                <p className="text-white/50 leading-relaxed mb-8">
                  Our AI engine analyzes sensor data, crowd density, and historical patterns to predict bin fill rates — letting your team act before bins overflow, not after.
                </p>
                <ul className="space-y-3">
                  {[
                    'Crowd-adjusted fill rate predictions',
                    'Automated cleaning route optimization',
                    'Zone-level analytics and heatmaps',
                    'Event comparison and reporting',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[#00FF9C] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#00FF9C] hover:opacity-80 transition-opacity"
                  >
                    Access the platform <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Visual side */}
              <div className="relative bg-[#080C10] border-l border-white/5 lg:min-h-[400px] flex items-center justify-center p-10 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[#00FF9C]/5 rounded-none" />
                <div className="relative z-10 w-full max-w-xs space-y-3">
                  {/* Mock stat cards */}
                  {[
                    { label: 'Bins at capacity', value: '3', color: '#FF3B5C' },
                    { label: 'Active cleaners', value: '12', color: '#00FF9C' },
                    { label: 'Average fill rate', value: '67%', color: '#FFC857' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-lg px-4 py-3">
                      <span className="text-sm text-white/60">{item.label}</span>
                      <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                  <div className="mt-2 bg-[#00FF9C]/10 border border-[#00FF9C]/20 rounded-lg px-4 py-3 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#00FF9C] animate-pulse" />
                    <span className="text-xs text-[#00FF9C]">System live — all sensors reporting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to take control?</h2>
          <p className="text-white/50 text-lg mb-8">
            Log in to your PULSE dashboard and see your event from the ground up.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#00FF9C] text-black text-sm font-semibold rounded-lg hover:bg-[#00FF9C]/90 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-[#080C10] py-10 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00FF9C] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-white">PULSE</span>
            <span className="text-white/20 mx-2">·</span>
            <span className="text-xs text-white/30">by Fostride</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="https://fostride.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Fostride</a>
          </div>
          <p className="text-xs text-white/20">© 2025 Fostride Technologies</p>
        </div>
      </footer>

    </div>
  );
}
