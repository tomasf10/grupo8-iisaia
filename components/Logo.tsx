// Una moneda con una flecha que vuelve: el vuelto.
export default function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="15" className="fill-brand-300 dark:fill-brand-400" />
      <circle cx="16" cy="16" r="11.5" className="stroke-brand-950/15" strokeWidth="1" />
      <g className="logo-arrow">
        <path
          d="M21.5 12.5A6.5 6.5 0 1 0 22 18"
          className="stroke-brand-950"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M22.6 8.6 21.7 12.8 17.6 11.9"
          className="stroke-brand-950"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      Vuelto
    </span>
  );
}
