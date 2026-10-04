import styles from './Skeleton.module.css';

const WIDTHS = ['92%', '78%', '86%', '64%', '81%'];

// Grey shimmer lines shown while the (simulated) AI summary loads.
export function Skeleton({ lines = 4, label = 'Loading' }) {
  return (
    <div role="status" aria-live="polite" className={styles.skeleton}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} aria-hidden="true" className={styles.line} style={{ width: WIDTHS[i % WIDTHS.length] }} />
      ))}
    </div>
  );
}
