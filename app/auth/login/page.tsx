'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Turnstile from '@/components/Turnstile'
import { useState } from 'react'
import { Zap, ArrowRight, Activity, MapPin, Users } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to login')
        throw new Error(errorMessage)
      }

      const role = data.user.role
      if (role.includes('admin')) router.push('/dashboard')
      else if (role.includes('manager')) router.push('/dashboard/manager')
      else if (role.includes('hr')) router.push('/dashboard/hr')
      else if (role.includes('staff')) router.push('/dashboard/staff')
      else router.push('/dashboard')
    } catch (error: any) {
      setError(error?.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#080C10] text-white">

      {/* ── Left: Branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1117] to-[#080C10]" />
        <div className="pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[#00FF9C]/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#00FF9C]/4 blur-[100px]" />

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#00FF9C] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">PULSE</span>
        </div>

        {/* Center headline */}
        <div className="relative z-10 max-w-sm">
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            Your event.<br />
            <span className="text-[#00FF9C]">Fully visible.</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-10">
            Monitor every bin, track every worker, and manage every zone — all from one command dashboard.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: Activity, label: 'Real-time bin fill monitoring' },
              { icon: MapPin, label: 'Zone & ground mapping' },
              { icon: Users, label: 'Staff deployment & tracking' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm text-white/60">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-[#00FF9C]" strokeWidth={1.75} />
                </div>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="relative z-10">
          <p className="text-xs text-white/20">© 2025 Fostride Technologies · PULSE Platform</p>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 border-l border-white/5">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10 self-start">
          <div className="w-7 h-7 rounded-md bg-[#00FF9C] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">PULSE</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">Welcome back</h2>
            <p className="text-sm text-white/40">Sign in to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Email or Phone
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="admin@pulse.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-[#00FF9C]/50 focus:ring-[#00FF9C]/20 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-[#00FF9C]/50 focus:ring-[#00FF9C]/20 rounded-lg"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Turnstile onVerify={setTurnstileToken} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-[#00FF9C] text-black text-sm font-semibold rounded-lg hover:bg-[#00FF9C]/90 disabled:opacity-60 transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/30">
              Need access?{' '}
              <Link href="/auth/signup" className="text-[#00FF9C] hover:opacity-80 transition-opacity">
                Request an account
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
