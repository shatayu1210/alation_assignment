import { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { QuoteBlock } from '../compose/QuoteBlock';
import { ME, people } from '../../data/thread';
import { formatFullDate } from '../../utils/formatDate';
import styles from './MessageCard.module.css';

function recipientsLabel(to) {
  const names = to.map((id) => (id === ME ? 'me' : people[id].name.split(' ')[0]));
  const sorted = names.includes('me') ? ['me', ...names.filter((n) => n !== 'me')] : names;
  return `to ${sorted.join(', ')}`;
}

/**
 * Where each quote appears in this email's paragraphs. A quote can span paragraphs,
 * so it's matched line by line. Returns, per paragraph, non-overlapping ranges sorted
 * by position.
 */
function quoteRanges(paragraphs, quotes) {
  const perParagraph = paragraphs.map(() => []);
  quotes.forEach((quote) => {
    const parts = quote.text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    paragraphs.forEach((paragraph, i) => {
      const part = parts.find((p) => paragraph.includes(p));
      if (!part) return;
      const start = paragraph.indexOf(part);
      perParagraph[i].push({ start, end: start + part.length, quote });
    });
  });
  return perParagraph.map((ranges) => {
    const sorted = ranges.sort((a, b) => a.start - b.start);
    return sorted.filter((r, i) => i === 0 || r.start >= sorted[i - 1].end);
  });
}

/**
 * One expanded email. Clicking the header collapses it again, like Gmail.
 *
 * Highlights:
 * - draftQuotes: text already quoted in the open draft. Always highlighted, so the writer
 *   won't quote it twice. Hovering links it to its quote in the draft (both darken), and
 *   clicking scrolls the draft to it. Quotes are removed only from the draft.
 * - transient: the quote just jumped to from a sent email; highlighted until the reader moves on.
 * - followed: the email being followed from the summary; tinted while it's followed.
 * - flash: a short tint that fades by itself, after jumping here from the draft.
 */
export function MessageCard({
  message,
  messagesById,
  draftQuotes = [],
  transient = null,
  followed = false,
  flash = false,
  hoveredQuoteId,
  onToggle,
  onShowSource,
  onHoverQuote,
  onClickDraftMark,
  showTrimmed = true,
}) {
  const [starred, setStarred] = useState(false);
  const sender = people[message.from];

  // Plain paragraphs, or text + quote blocks for a reply sent with the redesign.
  const items = message.blocks
    ? message.blocks.map((b) => (b.type === 'quote' ? b : { ...b, value: b.value.trim() }))
    : message.body.map((value, i) => ({ type: 'text', id: `p${i}`, value }));

  const quotes = [
    ...draftQuotes.map((q) => ({ id: q.quoteId, text: q.text, inDraft: true })),
    ...(transient && !draftQuotes.some((q) => q.quoteId === transient.quoteId)
      ? [{ id: transient.quoteId, text: transient.text, inDraft: false }]
      : []),
  ];
  const textItems = items.filter((item) => item.type === 'text');
  const ranges = quotes.length ? quoteRanges(textItems.map((t) => t.value), quotes) : [];

  let textIndex = -1;
  const renderText = (item) => {
    textIndex += 1;
    const paragraphRanges = ranges[textIndex] ?? [];
    if (paragraphRanges.length === 0) return <p key={item.id}>{item.value}</p>;

    const parts = [];
    let cursor = 0;
    paragraphRanges.forEach((range, k) => {
      const { quote } = range;
      const className = [
        styles.quoteMark,
        quote.inDraft && styles.draftMark,
        quote.inDraft && hoveredQuoteId === quote.id && styles.markHover,
        !quote.inDraft && transient?.fading && styles.markFading,
      ]
        .filter(Boolean)
        .join(' ');

      parts.push(item.value.slice(cursor, range.start));
      parts.push(
        <mark
          key={k}
          className={className}
          data-quote-mark={quote.id}
          onMouseEnter={quote.inDraft ? () => onHoverQuote(quote.id) : undefined}
          onMouseLeave={quote.inDraft ? () => onHoverQuote(null) : undefined}
          onClick={quote.inDraft ? () => onClickDraftMark(quote.id) : undefined}
        >
          {item.value.slice(range.start, range.end)}
        </mark>,
      );
      cursor = range.end;
    });
    parts.push(item.value.slice(cursor));
    return <p key={item.id}>{parts}</p>;
  };

  const cardClass = [
    styles.card,
    followed && styles.followed,
    flash && styles.flash,
    transient && styles.tinted,
    transient?.fading && styles.tintFading,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClass} aria-label={`Email from ${sender.name}`}>
      <div className={styles.header}>
        <Avatar personId={message.from} />
        <button
          type="button"
          className={styles.who}
          aria-expanded="true"
          onClick={() => onToggle(message.id)}
        >
          <span>
            <span className={styles.sender}>{sender.name}</span>{' '}
            <span className={styles.email}>&lt;{sender.email}&gt;</span>
          </span>
          <span className={styles.to}>
            {recipientsLabel(message.to)}
            <Icon name="arrow_drop_down" size={18} />
          </span>
        </button>
        <div className={styles.meta}>
          <span className={styles.date}>{formatFullDate(message.date)}</span>
          <IconButton
            icon="star"
            filled={starred}
            tone={starred ? 'accent' : 'default'}
            label={starred ? 'Starred' : 'Not starred'}
            size="sm"
            onClick={() => setStarred((s) => !s)}
          />
          <IconButton icon="add_reaction" label="Add emoji reaction" size="sm" />
          <IconButton icon="reply" label="Reply" size="sm" />
          <IconButton icon="more_vert" label="More" size="sm" tooltipAlign="end" />
        </div>
      </div>

      <div className={styles.body} data-quote-source={message.id}>
        {items.map((item) =>
          item.type === 'quote' ? (
            <QuoteBlock
              key={item.id}
              quote={item}
              source={messagesById[item.messageId]}
              onOpenSource={
                onShowSource
                  ? (quote) =>
                      onShowSource(
                        quote,
                        message.from === ME ? 'your reply' : `${sender.name.split(' ')[0]}’s email`,
                      )
                  : undefined
              }
            />
          ) : (
            renderText(item)
          ),
        )}
        {message.attachment && (
          <span className={styles.attachment}>
            <Icon name="picture_as_pdf" size={20} className={styles.pdf} />
            {message.attachment}
          </span>
        )}
        {showTrimmed && (
          <button type="button" className={styles.trimmed} aria-label="Show trimmed content">
            <Icon name="more_horiz" size={18} />
          </button>
        )}
      </div>
    </article>
  );
}
