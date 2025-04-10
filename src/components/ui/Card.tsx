import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-navy-800 p-6 rounded-lg border border-navy-700 shadow-md ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function CardHeader({ title, subtitle, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <h2 className="text-xl font-bold text-gold-500">{title}</h2>
      {subtitle && <p className="text-navy-300">{subtitle}</p>}
    </div>
  );
}

interface CardSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export function CardSection({ title, children, className = '', titleClassName = 'text-lg font-semibold text-white' }: CardSectionProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && <h3 className={`${titleClassName} mb-2`}>{title}</h3>}
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`bg-navy-700 p-4 rounded-md border border-navy-600 ${className}`}>
      {children}
    </div>
  );
} 