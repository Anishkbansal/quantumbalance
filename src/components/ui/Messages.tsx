import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface MessageProps {
  children: React.ReactNode;
  className?: string;
}

export function ErrorMessage({ children, className = '' }: MessageProps) {
  if (!children) return null;
  
  return (
    <div className={`p-4 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2 ${className}`}>
      <AlertCircle className="w-5 h-5" />
      <span>{children}</span>
    </div>
  );
}

export function SuccessMessage({ children, className = '' }: MessageProps) {
  if (!children) return null;
  
  return (
    <div className={`p-4 rounded-md bg-green-900/50 text-green-300 flex items-center gap-2 ${className}`}>
      <Check className="w-5 h-5" />
      <span>{children}</span>
    </div>
  );
}

export function WarningMessage({ children, className = '' }: MessageProps) {
  if (!children) return null;
  
  return (
    <div className={`p-4 rounded-md bg-amber-900/30 border border-amber-700 text-amber-300 flex items-center gap-2 ${className}`}>
      <AlertCircle className="w-5 h-5" />
      <span>{children}</span>
    </div>
  );
} 