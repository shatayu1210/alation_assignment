import { useCallback, useRef, useState } from 'react';

// The reply draft is a list of blocks: text the person types, and quotes from emails.
// Keeping quotes as their own blocks (instead of a rich-text editor) makes inserting,
// removing, and linking quotes simple and reliable.
let nextId = 0;
const newId = (prefix) => `${prefix}${(nextId += 1)}`;
const textBlock = (value = '') => ({ type: 'text', id: newId('t'), value });

export function useDraft() {
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState(() => [textBlock()]);
  const [caret, setCaret] = useState(null); // { blockId, pos }: where the next quote goes
  const [focusRequest, setFocusRequest] = useState(null);

  // Undo/redo for quote changes (add/remove). Two in-memory stacks of earlier/later block
  // lists: they live only while this draft is open and are never saved. Typing clears them,
  // so Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z then fall back to the text area's own undo/redo.
  const history = useRef([]);
  const future = useRef([]);
  const remember = useCallback(() => {
    history.current.push(blocks);
    future.current = [];
  }, [blocks]);

  const focusBlock = useCallback((blockId, pos) => {
    setCaret({ blockId, pos });
    setFocusRequest({ blockId, pos });
  }, []);

  const start = useCallback(() => {
    const first = textBlock();
    setBlocks([first]);
    setOpen(true);
    setCaret(null);
    setFocusRequest({ blockId: first.id, pos: 0 });
  }, []);

  const close = useCallback(() => {
    history.current = [];
    future.current = [];
    setOpen(false);
    setBlocks([textBlock()]);
    setCaret(null);
    setFocusRequest(null);
  }, []);

  const updateText = useCallback((id, value) => {
    history.current = [];
    future.current = [];
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, value } : b)));
  }, []);

  // Insert a quote where the cursor last was (or at the end), then put the cursor right below it.
  const insertQuote = useCallback(
    ({ messageId, text }) => {
      const base = open ? blocks : [textBlock()];

      let index =
        open && caret ? base.findIndex((b) => b.id === caret.blockId && b.type === 'text') : -1;
      if (index === -1) {
        for (let i = base.length - 1; i >= 0; i -= 1) {
          if (base[i].type === 'text') {
            index = i;
            break;
          }
        }
      }

      const target = base[index];
      const pos =
        open && caret?.blockId === target.id ? Math.min(caret.pos, target.value.length) : target.value.length;
      // Keep the person's own blank lines on both sides of the cursor, so space they
      // left before adding a quote stays there.
      const before = target.value.slice(0, pos);
      const after = textBlock(target.value.slice(pos));
      const quote = { type: 'quote', id: newId('q'), messageId, text };

      if (open) remember();
      setBlocks([
        ...base.slice(0, index),
        ...(before ? [{ ...target, value: before }] : []),
        quote,
        after,
        ...base.slice(index + 1),
      ]);
      setOpen(true);
      focusBlock(after.id, 0);
    },
    [open, blocks, caret, focusBlock, remember],
  );

  // Remove a quote, join the text around it, and keep the cursor where the quote was.
  const removeQuote = useCallback(
    (id) => {
      const i = blocks.findIndex((b) => b.id === id);
      if (i === -1) return;
      remember();
      const before = blocks[i - 1];
      const after = blocks[i + 1];
      let next;
      let focus = null;

      if (before?.type === 'text' && after?.type === 'text') {
        const value = before.value && after.value ? `${before.value}\n${after.value}` : before.value || after.value;
        const merged = { ...before, value };
        next = [...blocks.slice(0, i - 1), merged, ...blocks.slice(i + 2)];
        focus = { blockId: merged.id, pos: before.value.length };
      } else {
        next = [...blocks.slice(0, i), ...blocks.slice(i + 1)];
        if (after?.type === 'text') focus = { blockId: after.id, pos: 0 };
        else if (before?.type === 'text') focus = { blockId: before.id, pos: before.value.length };
      }

      if (next.length === 0 || next[next.length - 1].type !== 'text') {
        const last = textBlock();
        next.push(last);
        focus = focus ?? { blockId: last.id, pos: 0 };
      }
      setBlocks(next);
      if (focus) focusBlock(focus.blockId, focus.pos);
    },
    [blocks, focusBlock, remember],
  );

  const canUndo = useCallback(() => history.current.length > 0, []);
  const canRedo = useCallback(() => future.current.length > 0, []);

  // Switch to a saved block list and put the cursor somewhere sensible:
  // at the end of a quote that came back, or where a quote that went away used to be.
  const applySnapshot = useCallback(
    (target) => {
      const currentIds = new Set(blocks.map((b) => b.id));
      const targetIds = new Set(target.map((b) => b.id));
      setBlocks(target);

      const restored = target.find((b) => b.type === 'quote' && !currentIds.has(b.id));
      if (restored) {
        focusBlock(restored.id, 1);
        return;
      }
      const goneIndex = blocks.findIndex((b) => b.type === 'quote' && !targetIds.has(b.id));
      const before = blocks[goneIndex - 1];
      const landing = before && targetIds.has(before.id) ? before : target.find((b) => b.type === 'text');
      if (landing) focusBlock(landing.id, landing === before ? before.value.length : 0);
    },
    [blocks, focusBlock],
  );

  const undo = useCallback(() => {
    const previous = history.current.pop();
    if (!previous) return;
    future.current.push(blocks);
    applySnapshot(previous);
  }, [blocks, applySnapshot]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(blocks);
    applySnapshot(next);
  }, [blocks, applySnapshot]);

  // Make room to type above a quote (optionally starting with a typed character).
  const addTextBefore = useCallback(
    (quoteId, initial = '') => {
      const i = blocks.findIndex((b) => b.id === quoteId);
      if (i === -1) return;
      const fresh = textBlock(initial);
      setBlocks([...blocks.slice(0, i), fresh, ...blocks.slice(i)]);
      focusBlock(fresh.id, initial.length);
    },
    [blocks, focusBlock],
  );

  // Type a character into the text line next to a quote and move the cursor there.
  const typeInto = useCallback(
    (textId, char, atStart) => {
      const block = blocks.find((b) => b.id === textId);
      if (!block) return;
      const value = atStart ? char + block.value : block.value + char;
      setBlocks(blocks.map((b) => (b.id === textId ? { ...b, value } : b)));
      focusBlock(textId, atStart ? char.length : value.length);
    },
    [blocks, focusBlock],
  );

  // Remove an empty line sitting above a quote at the top of the draft.
  const removeEmptyLineAbove = useCallback(
    (textId) => {
      const i = blocks.findIndex((b) => b.id === textId);
      if (i === -1 || blocks[i].value) return;
      const next = [...blocks.slice(0, i), ...blocks.slice(i + 1)];
      setBlocks(next);
      const below = next.slice(i).find((b) => b.type === 'text');
      if (below) focusBlock(below.id, 0);
    },
    [blocks, focusBlock],
  );

  const clearFocusRequest = useCallback(() => setFocusRequest(null), []);

  // Backspace with the cursor at the start of a quote: delete one empty line above it.
  // Returns false when there's no empty line left (the text above ends right there).
  const deleteLineAbove = useCallback(
    (quoteId) => {
      const i = blocks.findIndex((b) => b.id === quoteId);
      const prev = blocks[i - 1];
      if (i === -1 || prev?.type !== 'text') return false;
      if (prev.value === '') {
        setBlocks([...blocks.slice(0, i - 1), ...blocks.slice(i)]);
        return true;
      }
      if (prev.value.endsWith('\n')) {
        setBlocks(blocks.map((b) => (b.id === prev.id ? { ...b, value: b.value.slice(0, -1) } : b)));
        return true;
      }
      return false;
    },
    [blocks],
  );

  // Turn the draft into a thread message. `rich` keeps quotes as linked blocks.
  const toMessage = useCallback(
    ({ rich, ...meta }) => {
      const content = blocks.filter((b) => b.type === 'quote' || b.value.trim());
      if (content.length === 0) return null;
      const body = content.map((b) => (b.type === 'quote' ? `“${b.text}”` : b.value.trim()));
      return { ...meta, body, blocks: rich ? content : undefined };
    },
    [blocks],
  );

  return {
    open,
    blocks,
    focusRequest,
    start,
    close,
    updateText,
    setCaret,
    focusBlock,
    insertQuote,
    removeQuote,
    canUndo,
    canRedo,
    undo,
    redo,
    addTextBefore,
    typeInto,
    removeEmptyLineAbove,
    deleteLineAbove,
    clearFocusRequest,
    toMessage,
  };
}
