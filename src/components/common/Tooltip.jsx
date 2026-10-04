import { cloneElement, useId } from 'react';
import styles from './Tooltip.module.css';

/**
 * Gmail-style tooltip: dark label below the control, shown on hover or keyboard focus.
 * `describe` links the label to the control for screen readers; turn it off when the
 * control's aria-label already says the same thing.
 */
export function Tooltip({ label, align = 'center', describe = true, className = '', children }) {
  const id = useId();
  const child = describe ? cloneElement(children, { 'aria-describedby': id }) : children;

  return (
    <span className={`${styles.wrap} ${className}`}>
      {child}
      <span role="tooltip" id={id} className={`${styles.tip} ${styles[align]}`}>
        {label}
      </span>
    </span>
  );
}
