import React from 'react';
import { Loader2 } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
}

export function Input({ label, helpText, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && <label className="block text-navy-300 mb-2" htmlFor={props.id}>{label}</label>}
      <input
        className={`w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:border-gold-500 focus:outline-none ${className}`}
        {...props}
      />
      {helpText && <p className="text-navy-400 text-sm mt-1">{helpText}</p>}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  loading = false, 
  icon, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md transition-colors flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-gold-500 text-navy-900 hover:bg-gold-400',
    secondary: 'bg-navy-700 text-white hover:bg-navy-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-500'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  helpText?: string;
}

export function FormField({ label, children, helpText }: FormFieldProps) {
  return (
    <div>
      <label className="block text-navy-300 mb-2">{label}</label>
      {children}
      {helpText && <p className="text-navy-400 text-sm mt-1">{helpText}</p>}
    </div>
  );
} 