import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { C } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variants: Record<Variant, React.CSSProperties> = {
  primary: { background: C.brown, color: C.cream },
  secondary: { background: C.mustardSoft, color: C.mustardDark, border: `1px solid ${C.mustard}` },
  ghost: { background: 'transparent', color: C.brown, border: `1px solid ${C.creamWarm}` },
  danger: { background: '#fbeae5', color: '#b4412e', border: '1px solid #f5c6bb' },
};

const sizes = { sm: 'px-4 py-2 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-sm' };

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-full font-semibold transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 ${sizes[size]} ${fullWidth ? 'w-full justify-center' : ''} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
