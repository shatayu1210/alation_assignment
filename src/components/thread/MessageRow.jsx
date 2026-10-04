import { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { QuoteIcon } from '../common/QuoteIcon';
import { Tooltip } from '../common/Tooltip';
import { people } from '../../data/thread';
import { formatRowDate } from '../../utils/formatDate';
import styles from './MessageRow.module.css';

/**
 * One collapsed email: avatar, sender, a one-line preview, and the date.
 * While a draft is open, an "In draft" label shows this email is quoted in it. The label is
 * only an indicator; clicking anywhere on the row opens the email, and when it's quoted,
 * also scrolls the draft to that quote.
 */
export function MessageRow({ message, inDraft = false, onToggle, onShowDraftQuote }) {
  const [starred, setStarred] = useState(false);
  const sender = people[message.from];
  const preview = message.body.join(' ').replace(/\n/g, ' ');
  const open = () => (inDraft ? onShowDraftQuote(message.id) : onToggle(message.id));

  return (
    <div className={styles.row} onClick={open}>
      <Avatar personId={message.from} />
      <div className={styles.main}>
        <span className={styles.senderLine}>
          <button
            type="button"
            className={styles.expand}
            aria-expanded="false"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            <span className={styles.sender}>{sender.name}</span>
          </button>
          {inDraft && (
            <Tooltip label="Quoted in your draft" align="start" describe={false}>
              <span className={styles.inDraft}>
                <QuoteIcon size={14} />
                In draft
              </span>
            </Tooltip>
          )}
        </span>
        <span className={styles.preview}>{preview}</span>
      </div>
      <span className={styles.meta}>
        {message.attachment && <Icon name="attach_file" size={18} className={styles.clip} />}
        {formatRowDate(message.date)}
      </span>
      <span onClick={(e) => e.stopPropagation()}>
        <IconButton
          icon="star"
          filled={starred}
          tone={starred ? 'accent' : 'default'}
          label={starred ? 'Starred' : 'Not starred'}
          size="sm"
          tooltipAlign="end"
          onClick={() => setStarred((s) => !s)}
        />
      </span>
    </div>
  );
}
