import { people } from '../../data/thread';
import styles from './Avatar.module.css';

// Initial-letter avatar, like Gmail shows for contacts without a photo.
export function Avatar({ personId, size = 40 }) {
  const person = people[personId];
  return (
    <span
      aria-hidden="true"
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.45, background: person.color }}
    >
      {person.name.charAt(0)}
    </span>
  );
}
