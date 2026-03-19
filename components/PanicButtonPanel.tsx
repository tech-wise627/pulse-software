'use client';

import { useState } from 'react';
import { AlertTriangle, Send, X, MapPin, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createIssueReport, IssueReport } from '@/lib/operations-intelligence';

interface PanicButtonPanelProps {
  staffName?: string;
  zone?: string;
  currentBinId?: string;
  userLocation?: [number, number];
  onIssueReported?: (issue: IssueReport) => void;
}

const ISSUE_TYPES = [
  { value: 'bin_damaged', label: 'Bin Damaged' },
  { value: 'overflow_emergency', label: 'Overflow Emergency' },
  { value: 'crowd_problem', label: 'Crowd Problem' },
  { value: 'safety_issue', label: 'Safety Issue' },
  { value: 'other', label: 'Other' },
];

export default function PanicButtonPanel({
  staffName = 'Staff Member',
  zone = 'Unknown Zone',
  currentBinId = 'BIN-001',
  userLocation = [0, 0],
  onIssueReported,
}: PanicButtonPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [reportedIssues, setReportedIssues] = useState<IssueReport[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitIssue = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);

    // Create issue report
    const report = createIssueReport(
      'staff-001', // Would come from auth context in real app
      staffName,
      zone,
      currentBinId,
      selectedType as any,
      description,
      userLocation[0],
      userLocation[1]
    );

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    setReportedIssues(prev => [report, ...prev]);
    onIssueReported?.(report);

    // Reset form and close
    setSelectedType(null);
    setDescription('');
    setOpen(false);
    setIsSubmitting(false);
  };

  const recentIssues = reportedIssues.slice(0, 3);
  const highPriorityIssues = reportedIssues.filter(i => i.priority === 'high');

  return (
    <Card className="bg-[#11181F] border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Issue Reporting
          </CardTitle>
          {highPriorityIssues.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
              {highPriorityIssues.length} High Priority
            </Badge>
          )}
        </div>

        {/* Quick Panic Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Report Issue / Panic Button
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-[#11181F] border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Report Issue
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Worker Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-400 text-xs mb-1">Worker</p>
                  <p className="text-white font-semibold flex items-center gap-1">
                    <User className="w-3 h-3 text-[#00FF9C]" />
                    {staffName}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-slate-400 text-xs mb-1">Zone</p>
                  <p className="text-white font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#00FF9C]" />
                    {zone}
                  </p>
                </div>
              </div>

              {/* Issue Type Selection */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Issue Type</label>
                <Select value={selectedType || ''} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Select issue type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {ISSUE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value} className="text-white">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe the issue (optional)"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 min-h-20 resize-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitIssue}
                disabled={!selectedType || isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Send Alert to Manager'}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                Your location and bin info will be sent automatically
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* Recent Issues */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recentIssues.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">No issues reported</p>
          ) : (
            recentIssues.map(issue => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  issue.priority === 'high'
                    ? 'border-red-500/50 bg-red-500/5'
                    : issue.priority === 'medium'
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white">{issue.issueTypeLabel}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{issue.workerName}</p>
                  </div>
                  <Badge
                    className={`${
                      issue.priority === 'high'
                        ? 'bg-red-500 text-white text-xs'
                        : issue.priority === 'medium'
                        ? 'bg-yellow-500 text-white text-xs'
                        : 'bg-slate-600 text-white text-xs'
                    }`}
                  >
                    {issue.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                  <MapPin className="w-3 h-3 text-[#00FF9C]" />
                  <span>{issue.zone} • {issue.binId}</span>
                </div>

                {issue.description && (
                  <p className="text-xs text-slate-400 mb-1">{issue.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(issue.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
