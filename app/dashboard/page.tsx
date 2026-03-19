'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, Zap, Shield, Activity, ArrowRight } from 'lucide-react';

const roles = [
  {
    id: 'admin',
    label: 'Admin',
    title: 'Admin Dashboard',
    route: '/dashboard/admin',
    accent: '#FF3B5C',
    icon: Shield,
    description: 'System-wide monitoring and control across all events and locations.',
    features: ['System overview & analytics', 'Global alert management', 'Manager oversight', 'System configuration'],
    backLabel: 'Enter Admin Dashboard',
    textDark: false,
  },
  {
    id: 'manager',
    label: 'Manager',
    title: 'Manager Dashboard',
    route: '/dashboard/manager',
    accent: '#00FF9C',
    icon: LayoutDashboard,
    description: 'Monitor and manage your event location, bins, staff, and zones.',
    features: ['Real-time bin monitoring', 'Alert management', 'Staff assignment', 'Zone mapping'],
    backLabel: 'Open Manager Dashboard',
    textDark: true,
  },
  {
    id: 'staff',
    label: 'Staff',
    title: 'Staff Dashboard',
    route: '/dashboard/staff',
    accent: '#2F8CFF',
    icon: Activity,
    description: 'Your daily route, assignments, and bin collection tasks.',
    features: ['Daily assignments', 'Route tracking', 'Real-time bin info', 'Task completion'],
    backLabel: 'View My Route',
    textDark: false,
  },
  {
    id: 'hr',
    label: 'HR',
    title: 'HR Management',
    route: '/dashboard/hr',
    accent: '#a78bfa',
    icon: Users,
    description: 'Onboard staff, manage profiles, documents, and track team activity.',
    features: ['Staff onboarding', 'Employee profiles', 'Document management', 'Staff tracking'],
    backLabel: 'Manage Staff',
    textDark: false,
  },
];

function RoleCard({ role }: { role: typeof roles[0] }) {
  const [hovered, setHovered] = useState(false);
  const Icon = role.icon;

  return (
    <div
      className="relative h-72 rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{ border: `1px solid ${hovered ? role.accent + '50' : 'rgba(255,255,255,0.08)'}`, transition: 'border-color 0.4s ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shared solid background */}
      <div className="absolute inset-0" style={{ backgroundColor: '#0D1117' }} />

      {/* Accent glow — always present, intensifies on hover */}
      <div
        className="absolute pointer-events-none rounded-full blur-3xl transition-all duration-500"
        style={{
          backgroundColor: role.accent,
          width: 220, height: 220,
          top: hovered ? -60 : -80,
          right: hovered ? -60 : -80,
          opacity: hovered ? 0.18 : 0.08,
        }}
      />

      {/* ── FRONT ── */}
      <div
        className="absolute inset-0 p-7 flex flex-col justify-between"
        style={{
          opacity: hovered ? 0 : 1,
          transform: hovered ? 'translateY(-12px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.35s ease',
          pointerEvents: hovered ? 'none' : 'auto',
        }}
      >
        <div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
            style={{ backgroundColor: `${role.accent}18`, border: `1px solid ${role.accent}35` }}
          >
            <Icon className="w-5 h-5" style={{ color: role.accent }} strokeWidth={1.75} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: role.accent }}>
            {role.label}
          </p>
          <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{role.title}</h3>
          <p className="text-sm text-white/40 mt-2 leading-relaxed">{role.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Hover to explore →</span>
        </div>
      </div>

      {/* ── BACK ── */}
      <div
        className="absolute inset-0 p-7 flex flex-col justify-between"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.3s ease 0.05s, transform 0.35s ease 0.05s',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: role.accent }}>
            What you can do
          </p>
          <ul className="space-y-3">
            {role.features.map((f, i) => (
              <li
                key={f}
                className="flex items-center gap-2.5 text-sm text-white/75"
                style={{
                  opacity: hovered ? 1 : 0,
                  transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
                  transition: `opacity 0.25s ease ${0.08 + i * 0.06}s, transform 0.3s ease ${0.08 + i * 0.06}s`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: role.accent }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => window.location.href = role.route}
          className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          style={{
            backgroundColor: role.accent,
            color: role.textDark ? '#000' : '#fff',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s, background-color 0.2s',
          }}
        >
          {role.backLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-[#080C10] flex flex-col items-center justify-center px-6 py-16">
      {/* Background ambient */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px]"
        style={{ backgroundColor: '#00FF9C', opacity: 0.04 }}
      />

      {/* Header */}
      <div className="text-center mb-14 relative z-10">
        <div className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#00FF9C] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">PULSE</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
          Choose your role
        </h1>
        <p className="text-white/40 text-base max-w-xs mx-auto leading-relaxed">
          Hover a card to see details, then click to enter your dashboard.
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>

      <p className="mt-14 text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.15)' }}>
        PULSE · Predictive Understanding of Litter & Spatial Events
      </p>
    </div>
  );
}
