export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--color-brand-600)" />
      <path
        d="M12 28V13.5A1.5 1.5 0 0 1 13.5 12h9.8c3.4 0 5.7 2 5.7 5s-2.3 5.1-5.7 5.1H17"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 20h9"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity=".65"
      />
    </svg>
  );
}
