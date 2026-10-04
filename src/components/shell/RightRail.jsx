import { IconButton } from '../common/IconButton';
import styles from './RightRail.module.css';

// Neutral stand-ins for the side-panel apps (the real app icons are Google trademarks).
const APPS = [
  { icon: 'calendar_month', label: 'Calendar' },
  { icon: 'lightbulb', label: 'Keep' },
  { icon: 'task_alt', label: 'Tasks' },
  { icon: 'person', label: 'Contacts' },
];

export function RightRail() {
  return (
    <aside className={styles.rail} aria-label="Side panel apps">
      {APPS.map((app) => (
        <IconButton key={app.label} icon={app.icon} label={app.label} tooltipAlign="end" />
      ))}
      <span className={styles.divider} aria-hidden="true" />
      <IconButton icon="add" label="Get add-ons" tooltipAlign="end" />
    </aside>
  );
}
