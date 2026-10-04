// Quote icon (option A): a quote bar with text lines, matching how quotes look in the draft.
// Inline SVG so it inherits the text color and sizes like a Material Symbol.
export function QuoteIcon({ size = 18, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="4" y="5" width="2.5" height="14" rx="1.2" />
      <rect x="9" y="6" width="11" height="2" rx="1" />
      <rect x="9" y="11" width="9" height="2" rx="1" />
      <rect x="9" y="16" width="6" height="2" rx="1" />
    </svg>
  );
}
