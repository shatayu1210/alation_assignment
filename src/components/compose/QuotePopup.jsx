import { useEffect, useRef, useState } from 'react';
import { QuoteIcon } from '../common/QuoteIcon';
import styles from './QuotePopup.module.css';

// Finds the email body (marked with data-quote-source) that contains a DOM node.
function sourceOf(node) {
  const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  return el?.closest('[data-quote-source]') ?? null;
}

// Text that's already quoted can't be quoted again (that would nest or overlap quotes).
// If a selection runs into an existing quote, it's trimmed to stop right before it,
// on the side where the drag started. Returns false if nothing selectable is left.
function trimAroundQuotes(sel, source) {
  const range = sel.getRangeAt(0);
  const hits = [...source.querySelectorAll('[data-quote-mark]')].filter((m) => range.intersectsNode(m));
  if (hits.length === 0) return true;

  const forward =
    sel.anchorNode === sel.focusNode
      ? sel.anchorOffset <= sel.focusOffset
      : Boolean(sel.anchorNode.compareDocumentPosition(sel.focusNode) & Node.DOCUMENT_POSITION_FOLLOWING);
  const trimmed = document.createRange();
  if (forward) {
    trimmed.setStart(range.startContainer, range.startOffset);
    trimmed.setEndBefore(hits[0]);
  } else {
    trimmed.setStartAfter(hits[hits.length - 1]);
    trimmed.setEnd(range.endContainer, range.endOffset);
  }
  sel.removeAllRanges();
  if (trimmed.collapsed || !trimmed.toString().trim()) return false;
  sel.addRange(trimmed);
  return true;
}

/**
 * Shows a small "Draft a reply" / "Add to draft" button above text selected in an email.
 * Quoting is always this deliberate click: the Reply button keeps working as usual.
 */
export function QuotePopup({ enabled, draftOpen, scrollContainer, onQuote }) {
  const [selection, setSelection] = useState(null); // { x, y, messageId, text }
  const buttonRef = useRef(null);

  // Keyboard users: after selecting text (Shift + arrows), Tab goes straight to the
  // popup button, and Escape dismisses it.
  useEffect(() => {
    if (!selection) return undefined;
    const onKey = (event) => {
      if (event.key === 'Tab' && !event.shiftKey && document.activeElement !== buttonRef.current) {
        event.preventDefault();
        buttonRef.current?.focus();
      } else if (event.key === 'Escape') {
        setSelection(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selection]);

  useEffect(() => {
    if (!enabled) return undefined;

    function read() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const source = sourceOf(sel.anchorNode);
      if (!source || source !== sourceOf(sel.focusNode) || !trimAroundQuotes(sel, source)) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      // Anchor the popup where the selection ended (where the mouse is), not in the middle.
      // A selection that wraps lines has one rectangle per line: use the last one when the
      // drag went forward, the first one when it went backward.
      const rects = range.getClientRects();
      const forward =
        sel.anchorNode === sel.focusNode
          ? sel.anchorOffset <= sel.focusOffset
          : Boolean(sel.anchorNode.compareDocumentPosition(sel.focusNode) & Node.DOCUMENT_POSITION_FOLLOWING);
      const endRect = (forward ? rects[rects.length - 1] : rects[0]) ?? range.getBoundingClientRect();
      const edge = 110; // keep the whole popup on screen
      const x = Math.min(Math.max(forward ? endRect.right : endRect.left, edge), window.innerWidth - edge);
      setSelection({
        x,
        y: endRect.top,
        messageId: source.dataset.quoteSource,
        text,
      });
    }

    const readSoon = () => setTimeout(read, 0); // let the browser finish updating the selection
    const hideIfCleared = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setSelection(null);
    };

    document.addEventListener('mouseup', readSoon);
    document.addEventListener('keyup', readSoon);
    document.addEventListener('selectionchange', hideIfCleared);
    scrollContainer?.addEventListener('scroll', read, { passive: true });
    return () => {
      document.removeEventListener('mouseup', readSoon);
      document.removeEventListener('keyup', readSoon);
      document.removeEventListener('selectionchange', hideIfCleared);
      scrollContainer?.removeEventListener('scroll', read);
    };
  }, [enabled, scrollContainer]);

  if (!enabled || !selection) return null;

  return (
    <div className={styles.popup} style={{ left: selection.x, top: selection.y }}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        // Keep the text selected while clicking
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onQuote({ messageId: selection.messageId, text: selection.text });
          window.getSelection()?.removeAllRanges();
          setSelection(null);
        }}
      >
        <QuoteIcon size={18} />
        {draftOpen ? 'Add to draft' : 'Draft a reply'}
      </button>
    </div>
  );
}
