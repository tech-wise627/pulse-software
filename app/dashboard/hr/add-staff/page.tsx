'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import AddStaffForm from '@/components/AddStaffForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      console.log('[v0] Submitting staff form to backend...', data);
      
      const response = await fetch('/api/staff', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add staff');
      }

      console.log('[v0] Staff added successfully. Credentials:', result.login_credentials);
      
      // Optionally could show a toast here with credentials
      alert(`Staff added successfully!\\n\\nLogin ID: ${result.login_credentials.email}\\nPassword: ${result.login_credentials.password}`);

      router.push('/dashboard/hr/staff');
    } catch (error: any) {
      console.error('[v0] Error adding staff:', error);
      alert(error.message || 'An error occurred while adding the staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 transition-colors duration-500">
      <DashboardNav />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[800px] h-[500px] rounded-full bg-[#00FF9C] opacity-[0.02] blur-[120px] z-0" />
      
      <main className="relative z-10 container mx-auto py-10 px-6 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/dashboard/hr">
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 hover:text-white hover:bg-white/[0.08] transition-all">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase">Personnel Registration</h1>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-14">Initialize tracking protocols for new workforce members</p>
          </div>
        </div>

        <AddStaffForm onSubmit={handleSubmit} loading={loading} />
      </main>
    </div>
  );
}
