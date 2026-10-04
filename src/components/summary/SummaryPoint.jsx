import { Icon } from '../common/Icon';
import { Tooltip } from '../common/Tooltip';
import styles from './SummaryPoint.module.css';

/**
 * One summary point. Timeline points are buttons that link to their email, with the
 * full date and time in a tooltip on the short date. Topics points are plain text,
 * since one topic can come from several emails.
 */
export function SummaryPoint({
  point,
  date,
  fullDate,
  interactive = false,
  focused = false,
  preview = false,
  onSelect,
}) {
  const content = (
    <>
      {date && (
        <Tooltip label={fullDate} align="start" describe={false}>
          <span className={styles.date}>{date}</span>
        </Tooltip>
      )}
      <span>{point.text}</span>
      {point.attachment && (
        <span className={styles.chip}>
          <Icon name="picture_as_pdf" size={16} className={styles.pdf} />
          {point.attachment}
        </span>
      )}
    </>
  );

  return (
    <li className={styles.item} data-message-id={point.messageId}>
      {interactive ? (
        <button
          type="button"
          className={[
            styles.point,
            styles.interactive,
            focused && styles.focused,
            preview && !focused && styles.preview,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-current={focused ? 'true' : undefined}
          aria-label={`${fullDate}: ${point.text}`}
          onClick={() => onSelect(point.messageId)}
        >
          {content}
        </button>
      ) : (
        <div className={styles.point}>{content}</div>
      )}
    </li>
  );
}
