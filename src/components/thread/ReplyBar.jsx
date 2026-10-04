import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import styles from './ReplyBar.module.css';

// Gmail's sticky Reply / Forward bar at the bottom of a thread.
export function ReplyBar({ onReply }) {
  return (
    <div className={styles.bar}>
      <button type="button" className={styles.pill} onClick={onReply}>
        <Icon name="reply" size={20} />
        Reply
      </button>
      <button type="button" className={styles.pill}>
        <Icon name="forward" size={20} />
        Forward
      </button>
      <span className={styles.emoji}>
        <IconButton icon="add_reaction" label="Add emoji reaction" />
      </span>
    </div>
  );
}
