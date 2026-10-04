import styles from './OlderMessagesFold.module.css';

// The numbered circle Gmail uses to fold the middle of a long thread.
export function OlderMessagesFold({ count, onOpen }) {
  return (
    <div className={styles.fold}>
      <button
        type="button"
        className={styles.circle}
        onClick={onOpen}
        aria-label={`Show ${count} older messages`}
      >
        {count}
      </button>
    </div>
  );
}
