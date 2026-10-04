import { useState } from 'react';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { Avatar } from '../common/Avatar';
import { ME } from '../../data/thread';
import styles from './TopBar.module.css';

// Logo file you add yourself at public/gmail-logo.png (not bundled: it's a Google trademark).
// If it's missing, a plain mail icon is shown instead.
const LOGO_SRC = '/gmail-logo.png';

export function TopBar({ changesApplied, onToggleChanges, onToggleNav }) {
  const [logoAvailable, setLogoAvailable] = useState(true);

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <IconButton icon="menu" label="Main menu" onClick={onToggleNav} />
        <span className={styles.wordmark}>
          {logoAvailable ? (
            <img src={LOGO_SRC} alt="" className={styles.logo} onError={() => setLogoAvailable(false)} />
          ) : (
            <Icon name="mail" size={24} />
          )}
          Gmail
        </span>
      </div>

      <div className={styles.search} role="search">
        <IconButton icon="search" label="Search" tooltipAlign="start" />
        <input className={styles.input} type="text" placeholder="Search mail" aria-label="Search mail" />
        <IconButton icon="tune" label="Show search options" />
      </div>

      {/* Presenter control for the demo, not part of Gmail */}
      <button
        type="button"
        role="switch"
        aria-checked={changesApplied}
        className={styles.demoSwitch}
        onClick={onToggleChanges}
      >
        <span className={`${styles.track} ${changesApplied ? styles.on : ''}`}>
          <span className={styles.thumb}>{changesApplied && <Icon name="check" size={14} />}</span>
        </span>
        {changesApplied ? 'Changes applied' : 'Changes removed'}
      </button>

      <div className={styles.actions}>
        <IconButton icon="help" label="Support" />
        <IconButton icon="settings" label="Settings" />
        <IconButton icon="auto_awesome" label="Ask Gemini" />
        <IconButton icon="apps" label="Google apps" tooltipAlign="end" />
        <span className={styles.account}>
          <Avatar personId={ME} size={32} />
        </span>
      </div>
    </header>
  );
}
