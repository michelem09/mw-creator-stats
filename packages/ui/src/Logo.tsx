/** The app mark: a rounded dark tile with three bars (teal / amber / cream).
 *  Mirrors packages/extension/icon.svg so the header, extension icon and favicon match. */
export function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      role="img"
      aria-label="MakerWorld Creator Stats logo"
    >
      <rect x="4" y="4" width="120" height="120" rx="28" fill="#14110d" />
      <rect x="4" y="4" width="120" height="120" rx="28" fill="none" stroke="#332a1f" strokeWidth="3" />
      <rect x="28" y="30" width="20" height="72" rx="5" fill="#3fb9a6" />
      <rect x="54" y="58" width="20" height="44" rx="5" fill="#e8902a" />
      <rect x="80" y="30" width="20" height="72" rx="5" fill="#e8dfd2" />
    </svg>
  );
}
