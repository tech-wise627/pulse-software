'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ScrollableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function ScrollableDialog({
  open,
  onOpenChange,
  title,
  children,
}: ScrollableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 p-0 flex flex-col max-h-[85vh] sm:max-w-xl w-[95vw]">
        <div className="flex-shrink-0 border-b border-slate-700 px-6 py-4">
          <DialogTitle className="text-white text-xl">{title}</DialogTitle>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-600">
          <div className="pb-4">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
