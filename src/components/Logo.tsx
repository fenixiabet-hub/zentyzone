/**
 * Zentyzone — Logo (marca circular tipo sol)
 */
import { C } from '../theme';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <div
      className="rounded-3xl flex items-center justify-center"
      style={{ width: size, height: size, background: C.mustard }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" fill={C.cream} />
        <path
          d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"
          stroke={C.cream}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
