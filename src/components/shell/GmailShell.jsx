import { useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { RightRail } from './RightRail';
import styles from './GmailShell.module.css';

// Narrower than this, the navigation starts as an icon-only rail, like Gmail.
const NARROW_QUERY = '(max-width: 1100px)';

// Static Gmail frame. Only the thread inside it (and the demo switch) is interactive.
export function GmailShell({ changesApplied, onToggleChanges, children }) {
  const [navCollapsed, setNavCollapsed] = useState(() => window.matchMedia(NARROW_QUERY).matches);

  // Collapse or expand automatically when the window crosses the breakpoint;
  // the menu button can still toggle it at any size.
  useEffect(() => {
    const media = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNavCollapsed(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <div className={`${styles.shell} ${navCollapsed ? styles.collapsed : ''}`}>
      <TopBar
        changesApplied={changesApplied}
        onToggleChanges={onToggleChanges}
        onToggleNav={() => setNavCollapsed((c) => !c)}
      />
      <SideNav collapsed={navCollapsed} />
      <main className={styles.main}>{children}</main>
      <RightRail />
    </div>
  );
}
