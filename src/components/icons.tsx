type P = { className?: string };

export const IgIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const FbIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14 9h2.5l.5-3H14V4.5c0-.9.3-1.5 1.6-1.5H17V.3C16.7.2 15.8 0 14.7 0 12.3 0 10.7 1.4 10.7 4v2H8v3h2.7v8H14V9Z" />
  </svg>
);

export const YtIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 0 0 1 7.5C.6 9.4.6 12 .6 12s0 2.6.4 4.5a3 3 0 0 0 2.1 2.1C5 19 12 19 12 19s7 0 8.9-.4a3 3 0 0 0 2.1-2.1c.4-1.9.4-4.5.4-4.5s0-2.6-.4-4.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" />
  </svg>
);

export const TtIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.5 0h-3.2v13.2a2.7 2.7 0 1 1-2.7-2.7c.3 0 .5 0 .8.1V7.4a6 6 0 1 0 5.1 6V7.7a7.2 7.2 0 0 0 4.2 1.3V5.8a4.2 4.2 0 0 1-4.2-4.2V0Z" />
  </svg>
);
