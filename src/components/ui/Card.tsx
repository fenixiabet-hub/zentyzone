import type { ReactNode } from 'react';
import { C } from '../../theme';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', style, padding = 'md' }: CardProps) {
  const padMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div
      className={`rounded-[2rem] ${padMap[padding]} ${className}`}
      style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10`, ...style }}
    >
      {children}
    </div>
  );
}
