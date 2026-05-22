import { Menu, X } from 'lucide-react';
import { C } from '../../theme';

interface MobileMenuButtonProps {
  open: boolean;
  onClick: () => void;
}

export function MobileMenuButton({ open, onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
      style={{ background: C.brown, color: C.cream, boxShadow: `0 4px 12px ${C.brown}30` }}
      aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
    >
      {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );
}
