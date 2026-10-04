import { Icon } from './Icon';
import { Tooltip } from './Tooltip';
import styles from './IconButton.module.css';

// Round icon button with a Gmail tooltip. The tooltip text doubles as the accessible name.
// tone="accent" colors the icon blue (used for a starred email).
export function IconButton({
  icon,
  label,
  onClick,
  size = 'md',
  filled = false,
  tone = 'default',
  tooltipAlign = 'center',
  className = '',
  ...rest
}) {
  return (
    <Tooltip label={label} align={tooltipAlign} describe={false}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`${styles.button} ${styles[size]} ${tone === 'accent' ? styles.accent : ''} ${className}`}
        {...rest}
      >
        <Icon name={icon} size={size === 'sm' ? 18 : 20} filled={filled} />
      </button>
    </Tooltip>
  );
}
