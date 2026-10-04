import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { Tooltip } from '../common/Tooltip';
import { QuoteBlock } from './QuoteBlock';
import { ME } from '../../data/thread';
import styles from './Composer.module.css';

// Static Gmail formatting tools (shown for realism, not part of the prototype)
const TOOLS = [
  { icon: 'text_format', label: 'Formatting options' },
  { icon: 'attach_file', label: 'Attach files' },
  { icon: 'link', label: 'Insert link' },
  { icon: 'mood', label: 'Insert emoji' },
  { icon: 'add_to_drive', label: 'Insert files using Drive' },
  { icon: 'image', label: 'Insert photo' },
  { icon: 'lock_clock', label: 'Turn confidential mode on / off' },
  { icon: 'edit', label: 'Insert signature' },
  { icon: 'more_vert', label: 'More options' },
];

const MIN_EDITOR = 80;
const RESIZE_STEP = 32;

function autoSize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

const isFirstLine = (value, pos) => pos === 0 || value.lastIndexOf('\n', pos - 1) === -1;
const isLastLine = (value, pos) => value.indexOf('\n', pos) === -1;

/**
 * Gmail's inline reply box.
 * - original: sits at the end of the thread, like today. Quoting means copy and paste.
 * - redesign: sticks to the bottom of the thread, holds linked quote blocks, and can be
 *   resized with the handle on its top edge.
 *
 * In the redesign, a quote behaves like one character of text: the cursor can sit at its
 * start or end and move across it with the arrow keys, Shift+Arrow selects it, and
 * Backspace removes it (with a confirmation unless it was selected first).
 */
export function Composer({
  variant,
  recipient,
  replyAll,
  onToggleReplyAll,
  draft,
  messagesById,
  wrapRef,
  hoveredQuoteId,
  onHoverQuote,
  onSend,
  onDiscard,
  onShowSource,
}) {
  const redesign = variant === 'redesign';
  const rootRef = useRef(null);
  const editorRef = useRef(null);
  const [quoteCaret, setQuoteCaret] = useState(null); // { id, side: 'start' | 'end' }
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [armedId, setArmedId] = useState(null);
  const [editorHeight, setEditorHeight] = useState(null); // null = default height

  // Grow each text area to fit its content.
  useLayoutEffect(() => {
    rootRef.current?.querySelectorAll('textarea').forEach(autoSize);
  }, [draft.blocks]);

  // Put the cursor where the draft asks. For a quote, pos 0 = its start, 1 = its end.
  useEffect(() => {
    const request = draft.focusRequest;
    if (!request) return;
    const el = rootRef.current?.querySelector(`[data-block-id="${request.blockId}"]`);
    if (el) {
      el.focus({ preventScroll: true });
      if (el.tagName === 'TEXTAREA') {
        el.setSelectionRange(request.pos, request.pos);
      } else {
        setQuoteCaret({ id: request.blockId, side: request.pos ? 'end' : 'start' });
        setSelectedQuoteId(null);
      }
    }
    draft.clearFocusRequest();
  }, [draft.focusRequest, draft.clearFocusRequest]);

  // While the Backspace confirmation shows, any click keeps the quote.
  useEffect(() => {
    if (!armedId) return undefined;
    const keep = () => setArmedId(null);
    document.addEventListener('mousedown', keep);
    return () => document.removeEventListener('mousedown', keep);
  }, [armedId]);

  // Move the cursor to the start or end of any block.
  function goTo(block, side) {
    if (!block) return;
    if (block.type === 'text') draft.focusBlock(block.id, side === 'end' ? block.value.length : 0);
    else draft.focusBlock(block.id, side === 'end' ? 1 : 0);
  }

  function armOrRemove(quoteId) {
    if (armedId === quoteId) {
      setArmedId(null);
      draft.removeQuote(quoteId);
    } else {
      setArmedId(quoteId);
    }
  }

  // ---------- Keys in a text line ----------

  function handleTextKeyDown(event, block, index) {
    const { selectionStart: pos, selectionEnd, value } = event.target;
    const collapsed = pos === selectionEnd;
    const prev = draft.blocks[index - 1];
    const next = draft.blocks[index + 1];

    if (event.key === 'Backspace' && collapsed && pos === 0) {
      if (prev?.type === 'quote') {
        event.preventDefault();
        armOrRemove(prev.id);
        return;
      }
      if (!prev && value === '' && next?.type === 'quote') {
        event.preventDefault();
        draft.removeEmptyLineAbove(block.id);
        return;
      }
    }
    if (armedId && event.key !== 'Backspace') setArmedId(null);
    if (event.shiftKey || !collapsed) return;

    // Line above a quote: Right at the end, or Down on the last line, goes to the quote's start.
    if (next?.type === 'quote') {
      if ((event.key === 'ArrowRight' && pos === value.length) || (event.key === 'ArrowDown' && isLastLine(value, pos))) {
        event.preventDefault();
        goTo(next, 'start');
        return;
      }
    }
    // Line below a quote: Left at the start goes to its end; Up on the first line goes to its start.
    if (prev?.type === 'quote') {
      if (event.key === 'ArrowLeft' && pos === 0) {
        event.preventDefault();
        goTo(prev, 'end');
      } else if (event.key === 'ArrowUp' && isFirstLine(value, pos)) {
        event.preventDefault();
        goTo(prev, 'start');
      }
    }
  }

  // ---------- Keys while the cursor is at a quote ----------

  function handleQuoteKeyDown(event, quote, index) {
    if (event.target !== event.currentTarget) return; // keys on the quote's own buttons
    const prev = draft.blocks[index - 1];
    const next = draft.blocks[index + 1];
    const side = quoteCaret?.id === quote.id ? quoteCaret.side : 'start';
    const selected = selectedQuoteId === quote.id;
    const setSide = (s) => setQuoteCaret({ id: quote.id, side: s });
    const { key } = event;

    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      if (selected) {
        // Selected on purpose, so no confirmation
        setSelectedQuoteId(null);
        draft.removeQuote(quote.id);
      } else if (key === 'Backspace' && side === 'start') {
        // At the start: delete empty lines above, then move into the text above
        if (!draft.deleteLineAbove(quote.id)) goTo(prev, 'end');
      } else {
        armOrRemove(quote.id);
      }
      return;
    }
    setArmedId(null);

    if (key === 'ArrowLeft') {
      event.preventDefault();
      if (event.shiftKey) {
        if (side === 'end') setSelectedQuoteId(quote.id);
        return;
      }
      setSelectedQuoteId(null);
      if (selected || side === 'end') setSide('start');
      else goTo(prev, 'end');
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      if (event.shiftKey) {
        if (side === 'start') setSelectedQuoteId(quote.id);
        return;
      }
      setSelectedQuoteId(null);
      if (selected || side === 'start') setSide('end');
      else goTo(next, 'start');
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setSelectedQuoteId(null);
      if (side === 'end') setSide('start');
      else goTo(prev, 'end');
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      setSelectedQuoteId(null);
      goTo(next, 'start');
    } else if (key === 'Enter') {
      event.preventDefault();
      setSelectedQuoteId(null);
      if (side === 'start') draft.addTextBefore(quote.id);
      else goTo(next, 'start');
    } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Typing at a quote's edge goes into the line next to it
      event.preventDefault();
      setSelectedQuoteId(null);
      if (side === 'end' || selected) {
        if (next?.type === 'text') draft.typeInto(next.id, key, true);
      } else if (prev?.type === 'text') {
        draft.typeInto(prev.id, key, false);
      } else {
        draft.addTextBefore(quote.id, key);
      }
    }
  }

  // ---------- Resize handle ----------

  // Never taller than the thread minus room for the subject and the top of the summary,
  // so the person always sees which conversation they're replying to.
  function maxEditorHeight() {
    const wrap = wrapRef?.current;
    const scroller = wrap?.parentElement;
    if (!wrap || !scroller) return window.innerHeight * 0.6;
    const chrome = wrap.offsetHeight - editorRef.current.offsetHeight;
    return scroller.clientHeight - 160 - chrome;
  }

  const clampHeight = (h) => Math.min(Math.max(h, MIN_EDITOR), Math.max(maxEditorHeight(), MIN_EDITOR));

  function startResize(event) {
    const handle = event.currentTarget;
    const startY = event.clientY;
    const startHeight = editorRef.current.offsetHeight;
    handle.setPointerCapture(event.pointerId);
    const move = (e) => setEditorHeight(clampHeight(startHeight + (startY - e.clientY)));
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
  }

  function handleResizeKey(event) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const current = editorRef.current.offsetHeight;
    setEditorHeight(clampHeight(current + (event.key === 'ArrowUp' ? RESIZE_STEP : -RESIZE_STEP)));
  }

  const onlyBlock = draft.blocks.length === 1;

  // Scrolling over the reply box never scrolls the thread behind it. The editor scrolls
  // its own content; at its ends (and over the header and toolbar) the wheel is stopped.
  useEffect(() => {
    const wrap = wrapRef?.current;
    const editor = editorRef.current;
    if (!redesign || !wrap) return undefined;
    const onWheel = (event) => {
      const inEditor = editor?.contains(event.target);
      const canScroll =
        inEditor &&
        (event.deltaY < 0
          ? editor.scrollTop > 0
          : editor.scrollTop + editor.clientHeight < editor.scrollHeight - 1);
      if (!canScroll) event.preventDefault();
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, [redesign, wrapRef]);

  // Cmd/Ctrl+Z right after adding or removing a quote undoes that change. It listens on the
  // whole document so it still works if focus moved off the reply box after a removal;
  // while someone types in another field, that field's own undo is left alone.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    if (!redesign) return undefined;
    const onKey = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const isUndo = mod && !event.shiftKey && key === 'z';
      const isRedo = mod && ((event.shiftKey && key === 'z') || (event.ctrlKey && key === 'y'));
      if (!isUndo && !isRedo) return;
      const current = draftRef.current;
      if (isUndo ? !current.canUndo() : !current.canRedo()) return;
      const active = document.activeElement;
      const inReplyBox = rootRef.current?.contains(active);
      const typingElsewhere = !inReplyBox && (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA');
      if (typingElsewhere) return;
      event.preventDefault();
      setArmedId(null);
      setSelectedQuoteId(null);
      if (isUndo) current.undo();
      else current.redo();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [redesign]);

  // Typing at the end of a line that grows past the visible area scrolls the draft along,
  // so new lines stay in view (the text areas grow instead of scrolling themselves).
  function keepCaretInView(textarea) {
    const editor = editorRef.current;
    if (!editor || textarea.selectionStart !== textarea.value.length) return;
    const bottom = textarea.offsetTop + textarea.offsetHeight + 8;
    if (bottom > editor.scrollTop + editor.clientHeight) {
      editor.scrollTop = bottom - editor.clientHeight;
    }
  }

  // Clicking empty space in the editor puts the cursor in the nearest line above the click.
  function handleEditorMouseDown(event) {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    const lines = [...event.currentTarget.querySelectorAll('textarea')];
    const target = lines.filter((t) => t.getBoundingClientRect().top <= event.clientY).pop() ?? lines[0];
    if (!target) return;
    const end = target.value.length;
    target.focus();
    target.setSelectionRange(end, end);
    draft.setCaret({ blockId: target.dataset.blockId, pos: end });
  }

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${redesign ? styles.sticky : ''}`}>
      <Avatar personId={ME} />
      <section ref={rootRef} aria-label="Reply" className={styles.card}>
        {redesign && (
          <div className={styles.handleZone}>
            <Tooltip label="Drag to resize" describe={false}>
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize reply box"
                aria-valuemin={MIN_EDITOR}
                aria-valuemax={Math.round(Math.max(maxEditorHeight(), MIN_EDITOR))}
                aria-valuenow={Math.round(editorHeight ?? editorRef.current?.offsetHeight ?? MIN_EDITOR)}
                tabIndex={0}
                className={styles.handle}
                onPointerDown={startResize}
                onKeyDown={handleResizeKey}
                onDoubleClick={() => setEditorHeight(null)}
              />
            </Tooltip>
          </div>
        )}

        <div className={styles.header}>
          <Icon name="reply" size={20} />
          <Icon name="arrow_drop_down" size={20} />
          <span className={styles.to}>{recipient}</span>
          <span className={styles.popout}>
            {redesign && (
              <IconButton
                icon={replyAll ? 'group' : 'person'}
                label={replyAll ? 'Reply only to people you quoted' : 'Include everyone in this thread'}
                size="sm"
                tone={replyAll ? 'accent' : 'default'}
                tooltipAlign="end"
                aria-pressed={replyAll}
                onClick={onToggleReplyAll}
              />
            )}
            <IconButton icon="open_in_new" label="Pop out reply" size="sm" tooltipAlign="end" />
          </span>
        </div>

        <div
          ref={editorRef}
          className={styles.editor}
          onMouseDown={handleEditorMouseDown}
          style={editorHeight ? { height: editorHeight, maxHeight: 'none', minHeight: 0 } : undefined}
        >
          {draft.blocks.map((block, index) =>
            block.type === 'text' ? (
              <textarea
                key={block.id}
                data-block-id={block.id}
                rows={1}
                className={styles.text}
                value={block.value}
                aria-label="Message body"
                placeholder={onlyBlock ? 'Press / to write using your Gmail & Drive' : ''}
                onChange={(e) => {
                  draft.updateText(block.id, e.target.value);
                  autoSize(e.target);
                  keepCaretInView(e.target);
                }}
                onSelect={(e) => draft.setCaret({ blockId: block.id, pos: e.target.selectionStart })}
                onKeyDown={redesign ? (e) => handleTextKeyDown(e, block, index) : undefined}
              />
            ) : (
              <QuoteBlock
                key={block.id}
                quote={block}
                blockId={block.id}
                source={messagesById[block.messageId]}
                caret={quoteCaret?.id === block.id && selectedQuoteId !== block.id ? quoteCaret.side : null}
                selected={selectedQuoteId === block.id}
                armed={armedId === block.id}
                hovered={hoveredQuoteId === block.id}
                onKeyDown={(e) => handleQuoteKeyDown(e, block, index)}
                onHover={onHoverQuote}
                onPlaceCaret={(side) => {
                  setQuoteCaret({ id: block.id, side });
                  setSelectedQuoteId(null);
                }}
                onLeave={() => {
                  setQuoteCaret(null);
                  setSelectedQuoteId(null);
                }}
                onOpenSource={onShowSource}
                onRemove={draft.removeQuote}
              />
            ),
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.send}>
            <button type="button" className={styles.sendMain} onClick={onSend}>
              Send
            </button>
            <button type="button" className={styles.sendMore} aria-label="More send options">
              <Icon name="arrow_drop_down" size={20} />
            </button>
          </div>
          <div className={styles.tools}>
            {TOOLS.map((tool) => (
              <IconButton key={tool.icon} icon={tool.icon} label={tool.label} size="sm" />
            ))}
          </div>
          <IconButton icon="delete" label="Discard draft" size="sm" tooltipAlign="end" onClick={onDiscard} />
        </div>
      </section>
    </div>
  );
}
