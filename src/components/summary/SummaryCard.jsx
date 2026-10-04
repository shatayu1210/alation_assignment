import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { SegmentedControl } from '../common/SegmentedControl';
import { Skeleton } from '../common/Skeleton';
import { Tooltip } from '../common/Tooltip';
import { SummaryPoint } from './SummaryPoint';
import { topicPoints, timelinePoints } from '../../data/summary';
import { formatShortDate, formatTooltipDate } from '../../utils/formatDate';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import styles from './SummaryCard.module.css';

const VIEW_OPTIONS = [
  { value: 'topics', label: 'Topics', tooltip: 'Summary grouped by topic' },
  { value: 'timeline', label: 'Timeline', tooltip: 'One point per email, in order' },
  { value: 'follow', label: 'Follow', tooltip: 'Keep the summary in view as you read' },
];

const MORPH_MS = 280; // open/close size morph
const COMPACT_HEIGHT = 146; // about four points, with part of the next one peeking in

/**
 * Gmail's AI Overview. In the redesign it gains Topics / Timeline / Follow and a
 * compact height with "Show more". In the original variant it behaves like today's Gmail.
 * All state lives in ThreadView; this component renders and animates it.
 */
export function SummaryCard({
  variant,
  open,
  mode,
  loading,
  messagesById,
  focusedId,
  previewId,
  tall,
  onOpen,
  onClose,
  onModeChange,
  onSelectPoint,
  onToggleTall,
}) {
  const redesign = variant === 'redesign';
  const titleId = useId();
  const shellRef = useRef(null);
  const bodyRef = useRef(null);
  const fromSize = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const following = mode === 'follow';
  const view = redesign && mode !== 'topics' ? 'timeline' : 'topics';

  // ---------- Open / close: the pill and the card morph into each other ----------

  function toggle(nextOpen) {
    const el = shellRef.current;
    if (el && !reducedMotion) fromSize.current = { w: el.offsetWidth, h: el.offsetHeight };
    if (nextOpen) onOpen();
    else onClose();
  }

  useLayoutEffect(() => {
    const el = shellRef.current;
    const from = fromSize.current;
    if (!el || !from) return undefined;
    fromSize.current = null;

    const to = { w: el.offsetWidth, h: el.offsetHeight };
    el.style.width = `${from.w}px`;
    el.style.height = `${from.h}px`;
    el.getBoundingClientRect(); // apply the starting size before animating
    el.classList.add(styles.morphing);
    el.style.width = `${to.w}px`;
    el.style.height = `${to.h}px`;

    const finish = () => {
      el.classList.remove(styles.morphing);
      el.style.width = '';
      el.style.height = '';
    };
    const timer = setTimeout(finish, MORPH_MS + 20);
    return () => {
      clearTimeout(timer);
      finish();
    };
  }, [open]);

  // ---------- Heights, "Show more", and the bottom fade ----------

  const [contentHeight, setContentHeight] = useState(0);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const measure = () => {
      setContentHeight(body.scrollHeight);
      setCanScrollDown(body.scrollTop + body.clientHeight < body.scrollHeight - 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    if (body.firstElementChild) observer.observe(body.firstElementChild);
    body.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      body.removeEventListener('scroll', measure);
    };
  }, [open, view, loading]);

  const hasMore = contentHeight > COMPACT_HEIGHT + 2;

  let maxHeight;
  if (redesign) {
    if (!tall) maxHeight = COMPACT_HEIGHT;
    else if (following) maxHeight = '30vh';
    else maxHeight = contentHeight; // exact height, so the animation is smooth both ways
  }

  // Switching Topics <-> Timeline starts the new list from the top.
  useEffect(() => {
    if (!following && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [view, following]);

  // Keep the followed point in view inside the summary. While the reader scrolls the
  // thread, the point for the email being read is kept in view too, so the summary follows.
  const scrollPointIntoView = (id) => {
    const body = bodyRef.current;
    const el = body?.querySelector(`[data-message-id="${id}"]`);
    if (!el) return;
    body.scrollTo({
      top: el.offsetTop - body.clientHeight / 2 + el.offsetHeight / 2,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  useEffect(() => {
    if (following && focusedId && !loading) scrollPointIntoView(focusedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [following, focusedId, loading, tall]);

  useEffect(() => {
    if (following && previewId && !loading) scrollPointIntoView(previewId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [following, previewId, loading]);

  // ---------- Render ----------

  return (
    <>
      <div ref={shellRef} className={`${styles.shell} ${open ? styles.shellOpen : styles.shellClosed}`}>
        {!open ? (
          <Tooltip label="Show AI Overview" align="start" describe={false}>
            <button
              type="button"
              className={styles.pill}
              aria-expanded="false"
              onClick={() => toggle(true)}
            >
              <Icon name="notes" size={20} />
              AI Overview
              <Icon name="expand_more" size={20} />
            </button>
          </Tooltip>
        ) : (
          <section className={styles.card} aria-labelledby={titleId}>
            <div className={styles.header}>
              <h2 id={titleId} className={styles.title}>
                <Icon name="notes" size={20} />
                AI Overview
              </h2>
              {redesign && (
                <SegmentedControl
                  label="Summary view"
                  options={VIEW_OPTIONS}
                  value={mode}
                  onChange={onModeChange}
                />
              )}
              <IconButton
                icon="expand_less"
                label="Hide AI Overview"
                size="sm"
                tooltipAlign="end"
                aria-expanded="true"
                onClick={() => toggle(false)}
              />
            </div>

            <div
              ref={bodyRef}
              className={`${styles.body} ${canScrollDown ? styles.faded : ''}`}
              style={maxHeight !== undefined ? { maxHeight } : undefined}
            >
              {loading ? (
                <Skeleton lines={5} label="Loading summary" />
              ) : (
                <ul key={view} className={styles.list}>
                  {view === 'topics'
                    ? topicPoints.map((point) => <SummaryPoint key={point.id} point={point} />)
                    : timelinePoints.map((point) => {
                        const { date } = messagesById[point.messageId];
                        return (
                          <SummaryPoint
                            key={point.messageId}
                            point={point}
                            date={formatShortDate(date)}
                            fullDate={formatTooltipDate(date)}
                            interactive
                            focused={following && point.messageId === focusedId}
                            preview={following && point.messageId === previewId}
                            onSelect={onSelectPoint}
                          />
                        );
                      })}
                </ul>
              )}
            </div>

            {redesign && !loading && (hasMore || tall) && (
              <div className={styles.footer}>
                <IconButton
                  icon={tall ? 'collapse_content' : 'expand_content'}
                  label={tall ? 'Show less' : 'Show more'}
                  size="sm"
                  tooltipAlign="end"
                  onClick={onToggleTall}
                />
              </div>
            )}
          </section>
        )}
      </div>

      {open && (
        <div className={styles.disclaimer}>
          <p>
            By Gemini; there may be mistakes.{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Learn more
            </a>
          </p>
          <div className={styles.feedback}>
            <IconButton icon="thumb_up" label="Good summary" size="sm" />
            <IconButton icon="thumb_down" label="Bad summary" size="sm" />
            <IconButton icon="error" label="Report a problem" size="sm" tooltipAlign="end" />
          </div>
        </div>
      )}
    </>
  );
}
