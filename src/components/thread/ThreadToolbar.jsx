import { IconButton } from '../common/IconButton';
import styles from './ThreadToolbar.module.css';

// Static Gmail toolbar. Tooltips match Gmail; the buttons aren't part of the prototype.
export function ThreadToolbar() {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Thread actions">
      <IconButton icon="arrow_back" label="Back to Inbox" tooltipAlign="start" />
      <div className={styles.group}>
        <IconButton icon="archive" label="Archive" />
        <IconButton icon="report" label="Report spam" />
        <IconButton icon="delete" label="Delete" />
      </div>
      <span className={styles.divider} aria-hidden="true" />
      <div className={styles.group}>
        <IconButton icon="mark_email_unread" label="Mark as unread" />
        <IconButton icon="drive_file_move" label="Move to" />
        <IconButton icon="more_vert" label="More" />
      </div>

      <div className={styles.pager}>
        <span>1 of 3</span>
        <IconButton icon="chevron_left" label="Newer" />
        <IconButton icon="chevron_right" label="Older" tooltipAlign="end" />
      </div>
    </div>
  );
}
