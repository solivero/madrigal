export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 32 48"
      className="flicker"
      aria-label="Loading"
    >
      <title>Loading</title>
      <rect x="13" y="22" width="6" height="20" rx="1" fill="#e6d5a8" />
      <rect x="11" y="42" width="10" height="3" rx="1" fill="#8a5a1f" />
      <path
        d="M16 4 Q12 12 12 17 Q12 22 16 22 Q20 22 20 17 Q20 12 16 4 Z"
        fill="#ffd87a"
      />
      <path
        d="M16 10 Q14 14 14 17 Q14 20 16 20 Q18 20 18 17 Q18 14 16 10 Z"
        fill="#ff9a3a"
      />
    </svg>
  );
}
