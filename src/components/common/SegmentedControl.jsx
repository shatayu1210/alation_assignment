import { Fragment, useRef } from 'react';
import { Tooltip } from './Tooltip';
import styles from './SegmentedControl.module.css';

/**
 * Material-style segmented switch with a sliding highlight.
 * Behaves as a radio group: arrow keys move between options.
 * options: [{ value, label, tooltip? }]
 */
export function SegmentedControl({ options, value, onChange, label }) {
  const buttonRefs = useRef([]);
  const index = Math.max(
    options.findIndex((o) => o.value === value),
    0,
  );

  function handleKeyDown(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    buttonRefs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={styles.group}
      style={{ '--count': options.length }}
      onKeyDown={handleKeyDown}
    >
      <span
        aria-hidden="true"
        className={styles.indicator}
        style={{
          transform: `translateX(${index * 100}%)`,
          // Round only the outer ends, matching the group's pill shape
          borderRadius: `${index === 0 ? '999px 0 0 999px' : index === options.length - 1 ? '0 999px 999px 0' : '0'}`,
        }}
      />
      {options.map((option, i) => {
        const selected = option.value === value;
        const radius =
          i === 0 ? '999px 0 0 999px' : i === options.length - 1 ? '0 999px 999px 0' : '0';
        const button = (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            className={`${styles.option} ${selected ? styles.selected : ''}`}
            style={{ borderRadius: radius }}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
        return option.tooltip ? (
          <Tooltip key={option.value} label={option.tooltip} align="center" className={styles.cell}>
            {button}
          </Tooltip>
        ) : (
          <Fragment key={option.value}>{button}</Fragment>
        );
      })}
    </div>
  );
}
