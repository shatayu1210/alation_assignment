import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import styles from './ThreadHeader.module.css';

export function ThreadHeader({ subject, labels }) {
  return (
    <div className={styles.header}>
      <h1 className={styles.subject}>
        {subject}
        {labels.map((label) => (
          <span key={label} className={styles.chip}>
            {label}
            <Icon name="close" size={14} />
          </span>
        ))}
      </h1>
      <div className={styles.actions}>
        <IconButton icon="unfold_more" label="Expand all" />
        <IconButton icon="print" label="Print all" />
        <IconButton icon="open_in_new" label="In new window" tooltipAlign="end" />
      </div>
    </div>
  );
}
