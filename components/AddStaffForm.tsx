'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PhotoCaptureModal from './PhotoCaptureModal';
import DocumentUploadArea from './DocumentUploadArea';
import { Camera, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StaffFormData {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  role: string;
  department: string;
  hire_date: string;
  emergency_contact: string;
  emergency_phone: string;
  photo?: string;
}

interface AddStaffFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  loading?: boolean;
}

export default function AddStaffForm({ onSubmit, loading = false }: AddStaffFormProps) {
  // ... existing state ...
  const [formData, setFormData] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    role: 'Sanitation Worker',
    department: 'Operations',
    hire_date: new Date().toISOString().split('T')[0],
    emergency_contact: '',
    emergency_phone: '',
  });

  const [photoOpen, setPhotoOpen] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.hire_date) newErrors.hire_date = 'Hire date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = new FormData();
      
      // Append basic fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'photo' && value) {
          data.append(key, value);
        }
      });

      // Handle Photo (base64 to Blob)
      if (formData.photo) {
        console.log('[v0] Processing photo for upload...');
        const res = await fetch(formData.photo);
        const blob = await res.blob();
        console.log(`[v0] Photo blob created: ${blob.size} bytes, type: ${blob.type}`);
        data.append('photo', blob, 'staff_photo.jpg');
      } else {
        console.warn('[v0] No photo found in formData');
      }

      // Handle Documents
      uploadedDocuments.forEach((doc, index) => {
        if (doc.file) {
          data.append('documents', doc.file);
        }
      });

      await onSubmit(data);

      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        date_of_birth: '',
        role: 'Sanitation Worker',
        department: 'Operations',
        hire_date: new Date().toISOString().split('T')[0],
        emergency_contact: '',
        emergency_phone: '',
      });
      setUploadedDocuments([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('[v0] Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Success Alert */}
      {success && (
        <Alert className="bg-green-900/30 border-green-500/50 text-green-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Staff member added successfully!</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert className="bg-red-900/30 border-red-500/50 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please fix the errors below</AlertDescription>
        </Alert>
      )}

      {/* Photo Section */}
      <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="border-b border-white/5 p-6 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-lg font-black tracking-tighter text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#00FF9C]" />
            BIOMETRIC SCAN
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-6">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="Staff"
                className="w-24 h-24 rounded-2xl object-cover border border-[#00FF9C]/30 shadow-[0_0_15px_rgba(0,255,156,0.1)]"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-dashed border-white/20">
                <User className="h-8 w-8 text-white/20" />
              </div>
            )}
            <Button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="h-10 px-6 rounded-xl bg-white/[0.05] hover:bg-[#00FF9C]/20 border border-white/10 hover:border-[#00FF9C]/50 text-xs font-black uppercase tracking-widest text-white hover:text-[#00FF9C] transition-all"
            >
              <Camera className="h-4 w-4 mr-2" />
              Initialize Capture
            </Button>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="border-b border-white/5 p-6 bg-white/[0.02]">
          <h3 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Identity Blueprint
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-[10px] font-bold uppercase tracking-widest text-white/50">First Name <span className="text-[#00FF9C]">*</span></Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="h-11 bg-white/[0.03] border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all font-medium"
                placeholder="Enter given name"
              />
              {errors.first_name && <p className="text-[#FF3B5C] text-xs font-medium mt-1">{errors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Last Name <span className="text-[#00FF9C]">*</span></Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="h-11 bg-white/[0.03] border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all font-medium"
                placeholder="Enter surname"
              />
              {errors.last_name && <p className="text-[#FF3B5C] text-xs font-medium mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Comms ID (Phone) <span className="text-[#00FF9C]">*</span></Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 bg-white/[0.03] border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all font-mono text-sm"
                placeholder="+91-9876543210"
              />
              {errors.phone && <p className="text-[#FF3B5C] text-xs font-medium mt-1">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Date of Origin <span className="text-[#00FF9C]">*</span></Label>
              <Input
                id="dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="h-11 bg-white/[0.03] border-white/10 rounded-xl text-white focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all font-mono text-sm [color-scheme:dark]"
              />
              {errors.date_of_birth && <p className="text-[#FF3B5C] text-xs font-medium mt-1">{errors.date_of_birth}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Job Information */}
      <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="border-b border-white/5 p-6 bg-white/[0.02]">
          <h3 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
            Operational Assignment
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Designation <span className="text-[#00FF9C]">*</span></Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="h-11 w-full bg-white/[0.03] border border-white/10 focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all text-white font-medium rounded-xl px-3 outline-none"
              >
                <option className="bg-[#080C10]">Sanitation Worker</option>
                <option className="bg-[#080C10]">Supervisor</option>
                <option className="bg-[#080C10]">Team Lead</option>
                <option className="bg-[#080C10]">Manager</option>
              </select>
              {errors.role && <p className="text-[#FF3B5C] text-xs font-medium mt-1">{errors.role}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Division <span className="text-[#00FF9C]">*</span></Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="h-11 bg-white/[0.03] border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all font-medium"
                placeholder="Operations"
              />
              {errors.department && <p className="text-[#FF3B5C] text-xs font-medium mt-1">{errors.department}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hire_date" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Activation Date <span className="text-[#00FF9C]">*</span></Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="h-11 bg-white/[0.03] border-white/10 rounded-xl text-white focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all font-mono text-sm [color-scheme:dark]"
            />
            {errors.hire_date && <p className="text-[#FF3B5C] text-xs font-medium mt-1">{errors.hire_date}</p>}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-[#0D1117] border border-[#FF3B5C]/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,59,92,0.02)]">
        <div className="border-b border-[#FF3B5C]/10 p-6 bg-white/[0.02]">
          <h3 className="text-lg font-black tracking-tighter text-[#FF3B5C] uppercase flex items-center gap-2">
            Emergency Protocol
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Primary Contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="h-11 bg-white/[0.03] border-[#FF3B5C]/20 rounded-xl text-white placeholder-white/20 focus:border-[#FF3B5C]/50 focus:ring-1 focus:ring-[#FF3B5C]/50 transition-all font-medium"
                placeholder="Contact Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_phone" className="text-[10px] font-bold uppercase tracking-widest text-white/50">Emergency Comms</Label>
              <Input
                id="emergency_phone"
                value={formData.emergency_phone}
                onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                className="h-11 bg-white/[0.03] border-[#FF3B5C]/20 rounded-xl text-white placeholder-white/20 focus:border-[#FF3B5C]/50 focus:ring-1 focus:ring-[#FF3B5C]/50 transition-all font-mono text-sm"
                placeholder="+91-9876543215"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-[#0D1117] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="border-b border-white/5 p-6 bg-white/[0.02]">
          <h3 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
            Credentials & Authorization
          </h3>
        </div>
        <div className="p-6">
          <DocumentUploadArea
            onFilesSelected={(files) => setUploadedDocuments(files)}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-black uppercase tracking-widest text-[11px] h-14 rounded-xl shadow-[0_0_20px_rgba(0,255,156,0.2)] disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {loading ? 'Initializing Protocol...' : 'Commit Unit to Registry'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="sm:w-32 bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/[0.05] font-black uppercase tracking-widest text-[11px] h-14 rounded-xl transition-all"
          onClick={() => window.history.back()}
        >
          Abort
        </Button>
      </div>

      {/* Photo Modal */}
      <PhotoCaptureModal
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        onPhotoCapture={(photo) => {
          setFormData({ ...formData, photo });
          setPhotoOpen(false);
        }}
      />
    </form>
  );
}
