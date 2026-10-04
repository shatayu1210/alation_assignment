import { useId } from 'react';
import { IconButton } from '../common/IconButton';
import { Tooltip } from '../common/Tooltip';
import { people } from '../../data/thread';
import { formatQuoteDate } from '../../utils/formatDate';
import styles from './QuoteBlock.module.css';

/**
 * A quote from an email in the thread: who said it, when, and the quoted text.
 *
 * In a sent email: the whole quote is clickable ("Show in thread").
 * In the draft (`onKeyDown` given): it behaves like one character of text. The cursor can
 * sit at its start or end (`caret`), Shift+Arrow selects it (`selected`), `armed` shows the
 * Backspace confirmation, and hovering it links it to its highlight in the thread (`hovered`).
 * Clicking it also scrolls the thread to the source.
 * Neutral styling on purpose: the blue-green AI accent is reserved for AI content.
 */
export function QuoteBlock({
  quote,
  source,
  blockId,
  caret = null,
  selected = false,
  armed = false,
  hovered = false,
  onKeyDown,
  onPlaceCaret,
  onLeave,
  onHover,
  onOpenSource,
  onRemove,
}) {
  const person = people[source.from];
  const editable = Boolean(onKeyDown);
  const hintId = useId();

  const head = (
    <div className={styles.head}>
      <span className={styles.name}>{person.name}</span>
      <span className={styles.date}>{formatQuoteDate(source.date)}</span>
      {onRemove && (
        <span className={styles.actions}>
          <IconButton
            icon="close"
            label="Remove quote"
            size="sm"
            tooltipAlign="end"
            onClick={() => onRemove(quote.id)}
          />
        </span>
      )}
    </div>
  );

  // ---------- In a sent email ----------
  if (!editable) {
    const clickable = Boolean(onOpenSource);
    const block = (
      <blockquote
        className={`${styles.quote} ${clickable ? styles.clickable : ''}`}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => onOpenSource(quote) : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenSource(quote);
                }
              }
            : undefined
        }
      >
        {head}
        <p className={styles.text}>{quote.text}</p>
      </blockquote>
    );
    return clickable ? (
      <Tooltip label="Show in thread" align="start" describe={false} className={styles.tooltipWrap}>
        {block}
      </Tooltip>
    ) : (
      block
    );
  }

  // ---------- In the draft ----------
  const className = [
    styles.quote,
    styles.editable,
    hovered && styles.hovered,
    caret === 'start' && styles.caretStart,
    caret === 'end' && styles.caretEnd,
    selected && styles.selected,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <blockquote
      className={className}
      data-block-id={blockId}
      data-quote-message={quote.messageId}
      tabIndex={0}
      aria-label={`Quote from ${person.name}`}
      aria-describedby={hintId}
      onKeyDown={onKeyDown}
      onMouseEnter={() => onHover(quote.id)}
      onMouseLeave={() => onHover(null)}
      onMouseDown={(e) => {
        if (e.target.closest('button')) return;
        // Cursor goes to whichever side of the quote was clicked
        const rect = e.currentTarget.getBoundingClientRect();
        onPlaceCaret(e.clientX > rect.left + rect.width / 2 ? 'end' : 'start');
      }}
      onClick={(e) => {
        if (!e.target.closest('button')) onOpenSource(quote);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onLeave();
      }}
    >
      {head}
      <p className={styles.text}>{quote.text}</p>
      <span id={hintId} className="sr-only">
        Use the arrow keys to move around the quote. Backspace removes it.
      </span>

      {armed && (
        <div className={styles.armed} role="status">
          <span className={styles.armedMain}>Press Backspace again to remove</span>
          <span className={styles.armedHint}>Click anywhere or press any key to keep</span>
        </div>
      )}
    </blockquote>
  );
}
