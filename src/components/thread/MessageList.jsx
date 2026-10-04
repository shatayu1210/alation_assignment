import { MessageCard } from './MessageCard';
import { MessageRow } from './MessageRow';
import { OlderMessagesFold } from './OlderMessagesFold';
import styles from './MessageList.module.css';

const NONE = [];

/**
 * Renders the thread: collapsed rows, expanded emails, and the fold for older ones.
 * Each email registers its DOM node so the summary and quotes can scroll to it.
 */
export function MessageList({
  messages,
  messagesById,
  foldedIds,
  foldOpen,
  expandedIds,
  draftQuotesByMessage,
  transient,
  flash,
  followedId,
  hoveredQuoteId,
  onOpenFold,
  onToggle,
  onHover,
  onShowSource,
  onShowDraftQuote,
  onHoverQuote,
  onClickDraftMark,
  registerMessage,
}) {
  const hidden = foldOpen ? new Set() : new Set(foldedIds);
  const firstFoldedIndex = messages.findIndex((m) => hidden.has(m.id));

  return (
    <div className={styles.list} onMouseLeave={() => onHover(null)}>
      {messages.map((message, index) => {
        if (index === firstFoldedIndex) {
          return <OlderMessagesFold key="fold" count={hidden.size} onOpen={onOpenFold} />;
        }
        if (hidden.has(message.id)) return null;

        const draftQuotes = draftQuotesByMessage[message.id] ?? NONE;
        const flashing = flash?.id === message.id;

        return (
          <div
            key={message.id}
            data-message-id={message.id}
            ref={(el) => registerMessage(message.id, el)}
            onMouseEnter={() => onHover(message.id)}
          >
            {expandedIds.has(message.id) ? (
              <MessageCard
                // A new key restarts the fade-out when the same email is flashed again
                key={flashing ? `flash-${flash.n}` : 'card'}
                message={message}
                messagesById={messagesById}
                draftQuotes={draftQuotes}
                transient={transient?.messageId === message.id ? transient : null}
                followed={followedId === message.id}
                flash={flashing}
                hoveredQuoteId={hoveredQuoteId}
                onToggle={onToggle}
                onShowSource={onShowSource}
                onHoverQuote={onHoverQuote}
                onClickDraftMark={onClickDraftMark}
                showTrimmed={index > 0 && !message.blocks}
              />
            ) : (
              <MessageRow
                message={message}
                inDraft={draftQuotes.length > 0}
                onToggle={onToggle}
                onShowDraftQuote={onShowDraftQuote}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
