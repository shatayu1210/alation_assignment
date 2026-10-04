import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { Tooltip } from '../common/Tooltip';
import styles from './SideNav.module.css';

const ITEMS = [
  { icon: 'inbox', label: 'Inbox', count: '1,284', active: true },
  { icon: 'star', label: 'Starred' },
  { icon: 'schedule', label: 'Snoozed' },
  { icon: 'send', label: 'Sent' },
  { icon: 'draft', label: 'Drafts', count: '2', bold: true },
  { icon: 'expand_more', label: 'More' },
];

// Gmail's left navigation. `collapsed` shows the icon-only rail.
export function SideNav({ collapsed = false }) {
  return (
    <nav className={`${styles.nav} ${collapsed ? styles.collapsed : ''}`} aria-label="Mailboxes">
      {collapsed ? (
        <Tooltip label="Compose" align="start" describe={false}>
          <button type="button" className={styles.composeIcon} aria-label="Compose">
            <Icon name="edit" size={24} />
          </button>
        </Tooltip>
      ) : (
        <button type="button" className={styles.compose}>
          <Icon name="edit" size={24} />
          Compose
        </button>
      )}

      <ul className={styles.list}>
        {ITEMS.map((item) => {
          const link = (
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-current={item.active ? 'page' : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={`${styles.item} ${item.active ? styles.active : ''} ${item.bold ? styles.bold : ''}`}
            >
              <Icon name={item.icon} filled={item.active} />
              {!collapsed && <span className={styles.label}>{item.label}</span>}
              {!collapsed && item.count && <span className={styles.count}>{item.count}</span>}
            </a>
          );
          return (
            <li key={item.label}>
              {collapsed ? (
                <Tooltip label={item.label} align="start" describe={false}>
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>

      {!collapsed && (
        <div className={styles.labelsHeader}>
          <span>Labels</span>
          <IconButton icon="add" label="Create new label" size="sm" />
        </div>
      )}
    </nav>
  );
}
