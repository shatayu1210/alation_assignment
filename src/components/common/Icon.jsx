// Material Symbols icon. Decorative by default; give the parent control its label.
export function Icon({ name, size = 20, filled = false, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size >= 24 ? 24 : 20}`,
      }}
    >
      {name}
    </span>
  );
}
