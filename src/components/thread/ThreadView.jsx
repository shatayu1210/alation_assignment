import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThreadToolbar } from './ThreadToolbar';
import { ThreadHeader } from './ThreadHeader';
import { MessageList } from './MessageList';
import { ReplyBar } from './ReplyBar';
import { SummaryCard } from '../summary/SummaryCard';
import { Composer } from '../compose/Composer';
import { QuotePopup } from '../compose/QuotePopup';
import { Icon } from '../common/Icon';
import { ME, NOW, people, thread } from '../../data/thread';
import { getFoldedIds } from '../../utils/thread';
import { formatShortDate } from '../../utils/formatDate';
import { timelinePoints } from '../../data/summary';
import { useDraft } from '../../hooks/useDraft';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import styles from './ThreadView.module.css';

// Simulated AI loading time, shown the first time each summary view is opened.
const LOAD_MS = 2000;
// Gap between an edge (top of view, stuck summary, or bottom bar) and an email we scroll to.
const SCROLL_GAP = 8;
// Room kept for the "Back to…" pill above the bottom bar.
const PILL_SPACE = 56;
// How far below the summary an email has to reach to count as "the one being read".
const READING_LINE = 24;
// How long the short tint on an opened email lasts, and how long fades take.
const FLASH_MS = 5100;
const FADE_MS = 400;
// Follow starts at the beginning of the conversation.
const FIRST_ID = thread.messages[0].id;
// The newest email is open by default; "Reply" answers its sender, like Gmail.
const LATEST_ID = thread.messages[thread.messages.length - 1].id;
const REPLY_TO = thread.messages[thread.messages.length - 1].from;

const viewFor = (mode) => (mode === 'topics' ? 'topics' : 'timeline');

/**
 * The thread page. Owns all interaction state.
 * variant "original" behaves like today's Gmail; "redesign" adds both solutions:
 * - Problem 1: Topics / Timeline / Follow summary, linked to the emails
 * - Problem 2: quoting from any email into a sticky reply box, with links back to the source
 */
export function ThreadView({ variant = 'redesign', foldOpen = false, onOpenFold }) {
  const redesign = variant === 'redesign';

  const [messages, setMessages] = useState(thread.messages);
  const foldedIds = useMemo(() => getFoldedIds(messages), [messages]);
  const messagesById = useMemo(() => Object.fromEntries(messages.map((m) => [m.id, m])), [messages]);

  const [expandedIds, setExpandedIds] = useState(() => new Set([LATEST_ID]));
  // The fold lives in App so it stays open when switching between versions.
  const setFoldOpen = useCallback(
    (open) => {
      if (open) onOpenFold?.();
    },
    [onOpenFold],
  );

  // Summary
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [mode, setMode] = useState('topics');
  const [loaded, setLoaded] = useState({ topics: false, timeline: false });
  const [loadingView, setLoadingView] = useState(null);
  // "Show more" is remembered separately for reading (Topics, Timeline) and for Follow,
  // so a Timeline that was expanded is still expanded after a trip through Follow.
  const [tallBrowse, setTallBrowse] = useState(false);
  const [tallFollow, setTallFollow] = useState(false);

  // Follow
  const [focusedId, setFocusedId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [pendingFocusId, setPendingFocusId] = useState(null);

  // Scrolling and highlights
  const [scrollTarget, setScrollTarget] = useState(null); // { id, kind, quoteId?, pill? }
  const [summaryStuck, setSummaryStuck] = useState(false);
  const [flash, setFlash] = useState(null); // { id, n }: short tint on an opened email

  // Reply and quotes
  const draft = useDraft();
  // A jump from a sent email's quote: the source is tinted and outlined, and a pill offers
  // a way back, until the reader goes back or scrolls the source out of view.
  const [transient, setTransient] = useState(null); // { messageId, text, quoteId, fading }
  const [backTo, setBackTo] = useState(null); // { top, name, sourceId, fading }
  const fadeTimer = useRef(0);
  // Quote hovered in the draft or in the thread: both copies darken together
  const [hoveredQuoteId, setHoveredQuoteId] = useState(null);
  // Who the reply goes to: everyone in the thread (default) or only the people quoted
  const [replyAll, setReplyAll] = useState(true);

  const scrollRef = useRef(null);
  const [scrollEl, setScrollEl] = useState(null);
  const attachScroll = useCallback((el) => {
    scrollRef.current = el;
    setScrollEl(el);
  }, []);
  const headerRef = useRef(null);
  const stickyRef = useRef(null);
  const composerRef = useRef(null);
  const messageEls = useRef(new Map());
  const autoScrolling = useRef(false);
  const autoScrollTimer = useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const following = mode === 'follow';
  const tall = following ? tallFollow : tallBrowse;

  // ---------- Screen reader announcements ----------
  // Changes that are only visible on screen are also spoken, through a polite live region.
  const [announcement, setAnnouncement] = useState('');

  // Which point is being followed
  useEffect(() => {
    if (!following || !focusedId) return;
    const point = timelinePoints.find((p) => p.messageId === focusedId);
    const message = messagesById[focusedId];
    if (point && message) setAnnouncement(`Following ${formatShortDate(message.date)}: ${point.text}`);
  }, [following, focusedId, messagesById]);

  // Quotes added to or removed from the draft
  const quoteCount = useRef(0);
  useEffect(() => {
    const quotes = draft.open ? draft.blocks.filter((b) => b.type === 'quote') : [];
    if (quotes.length > quoteCount.current) {
      const added = quotes[quotes.length - 1];
      const from = people[messagesById[added.messageId]?.from]?.name;
      setAnnouncement(from ? `Quote from ${from} added to your draft` : 'Quote added to your draft');
    } else if (quotes.length < quoteCount.current && draft.open) {
      setAnnouncement('Quote removed from your draft');
    }
    quoteCount.current = quotes.length;
  }, [draft.open, draft.blocks, messagesById]);

  // Quotes in the open draft, grouped by the email they came from
  const draftQuotesByMessage = useMemo(() => {
    const byMessage = {};
    if (!draft.open) return byMessage;
    draft.blocks
      .filter((b) => b.type === 'quote')
      .forEach((b) => {
        (byMessage[b.messageId] ??= []).push({ quoteId: b.id, text: b.text });
      });
    return byMessage;
  }, [draft.open, draft.blocks]);

  // Reply recipients. Today's Gmail Reply goes to the last sender only. In the redesign
  // it defaults to everyone in the thread, or can be narrowed to the people quoted.
  const recipientIds = useMemo(() => {
    if (!redesign) return [REPLY_TO];
    if (replyAll) return Object.keys(people).filter((id) => id !== ME);
    const quoted = [
      ...new Set(
        draft.blocks
          .filter((b) => b.type === 'quote')
          .map((b) => messagesById[b.messageId]?.from)
          .filter((id) => id && id !== ME),
      ),
    ];
    return quoted.length ? quoted : [REPLY_TO];
  }, [redesign, replyAll, draft.blocks, messagesById]);

  // ---------- Simulated loading ----------

  useEffect(() => {
    if (!loadingView) return undefined;
    const timer = setTimeout(() => {
      setLoaded((prev) => ({ ...prev, [loadingView]: true }));
      setLoadingView(null);
    }, LOAD_MS);
    return () => clearTimeout(timer);
  }, [loadingView]);

  const ensureLoaded = useCallback(
    (view) => {
      if (!loaded[view]) setLoadingView(view);
    },
    [loaded],
  );

  // ---------- Scrolling ----------

  const registerMessage = useCallback((id, el) => {
    if (el) messageEls.current.set(id, el);
    else messageEls.current.delete(id);
  }, []);

  // Programmatic scroll. Tracking pauses while it runs so highlights don't flicker past.
  const scrollThreadTo = useCallback(
    (top) => {
      const container = scrollRef.current;
      if (!container) return;
      autoScrolling.current = true;
      container.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion ? 'auto' : 'smooth' });
      window.clearTimeout(autoScrollTimer.current);
      autoScrollTimer.current = window.setTimeout(() => {
        autoScrolling.current = false;
      }, 700);
    },
    [reducedMotion],
  );

  useEffect(
    () => () => {
      window.clearTimeout(autoScrollTimer.current);
      window.clearTimeout(fadeTimer.current);
    },
    [],
  );

  // After the target email renders, scroll it into place:
  // - 'start': at the top, just below the summary when it's stuck
  // - 'source': just above the bottom bar (reply box, or Reply bar + "Back to…" pill) if it
  //   fits; if it's long, the quoted text is kept in view; if that's long too, it starts at the top
  useEffect(() => {
    if (!scrollTarget) return undefined;
    const frame = requestAnimationFrame(() => {
      const el = messageEls.current.get(scrollTarget.id);
      const container = scrollRef.current;
      if (el && container) {
        const topInset = following ? (stickyRef.current?.offsetHeight ?? 0) : 0;
        if (scrollTarget.kind === 'source') {
          const bottomInset =
            (container.lastElementChild?.offsetHeight ?? 0) + (scrollTarget.pill ? PILL_SPACE : 0);
          const available = container.clientHeight - topInset - bottomInset - 2 * SCROLL_GAP;
          if (el.offsetHeight <= available) {
            scrollThreadTo(el.offsetTop + el.offsetHeight - (container.clientHeight - bottomInset) + SCROLL_GAP);
          } else {
            const mark = el.querySelector(
              scrollTarget.quoteId ? `[data-quote-mark="${scrollTarget.quoteId}"]` : '[data-quote-mark]',
            );
            if (mark) {
              const markTop = mark.getBoundingClientRect().top - el.getBoundingClientRect().top;
              const markHeight = mark.getBoundingClientRect().height;
              const centering = markHeight > available ? 0 : (available - markHeight) / 2;
              scrollThreadTo(el.offsetTop + markTop - topInset - SCROLL_GAP - centering);
            } else {
              scrollThreadTo(el.offsetTop - topInset - SCROLL_GAP);
            }
          }
        } else {
          // Align the email's start just below the pinned summary (or the top of the view).
          const alignStart = () => {
            const inset = following ? (stickyRef.current?.offsetHeight ?? 0) : 0;
            scrollThreadTo(el.offsetTop - inset - SCROLL_GAP);
          };
          alignStart();
          // The summary may still be animating its height (turning on Follow, Show more),
          // and other emails may still be closing above. Once that settles, align again,
          // so a long email's first line isn't left hidden behind the summary.
          window.setTimeout(() => {
            if (autoScrolling.current) alignStart();
          }, 320);
        }
      }
      setScrollTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollTarget, following, scrollThreadTo]);

  // The summary's divider shadow shows only once emails scroll underneath it.
  useEffect(() => {
    if (!scrollEl) return undefined;
    const onScroll = () => {
      const threshold = headerRef.current?.offsetHeight ?? 0;
      setSummaryStuck(scrollEl.scrollTop > threshold);
    };
    onScroll();
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [scrollEl]);

  // Keep keyboard focus visible: when Tab moves focus, the browser scrolls the focused
  // element into view, but it doesn't know about the pinned summary at the top or the
  // pinned Reply bar / reply box at the bottom, so it could park the element underneath
  // them. scroll-padding tells the browser to leave room for both. Their heights change
  // (Follow on/off, Show more, reply box opening), so they're measured live.
  useEffect(() => {
    if (!scrollEl) return undefined;
    const update = () => {
      const top = following ? (stickyRef.current?.offsetHeight ?? 0) : 0;
      const bottom = scrollEl.lastElementChild?.offsetHeight ?? 0;
      scrollEl.style.scrollPaddingTop = `${top + SCROLL_GAP}px`;
      scrollEl.style.scrollPaddingBottom = `${bottom + SCROLL_GAP}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    if (stickyRef.current) observer.observe(stickyRef.current);
    if (scrollEl.lastElementChild) observer.observe(scrollEl.lastElementChild);
    return () => observer.disconnect();
  }, [scrollEl, following, draft.open]);

  // ---------- Highlights ----------

  const triggerFlash = useCallback((id) => setFlash({ id, n: Date.now() }), []);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  // Fade out the "Back to…" pill and the jump highlight together.
  const dismissBack = useCallback(() => {
    setBackTo((b) => b && { ...b, fading: true });
    setTransient((t) => t && { ...t, fading: true });
    window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      setBackTo(null);
      setTransient(null);
    }, FADE_MS);
  }, []);

  // Once the source email has been seen and then scrolls fully out of view,
  // the reader has moved on, so the pill and highlight go away.
  useEffect(() => {
    if (!backTo || backTo.fading || !scrollEl) return undefined;
    const el = messageEls.current.get(backTo.sourceId);
    if (!el) return undefined;
    let seen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) seen = true;
        else if (seen) dismissBack();
      },
      { root: scrollEl },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [backTo, scrollEl, dismissBack]);

  // ---------- Opening emails ----------

  // Make an email visible and open. In Follow, it becomes the only open, followed email.
  const reveal = useCallback(
    (id) => {
      if (foldedIds.includes(id)) setFoldOpen(true);
      if (following) {
        setExpandedIds(new Set([id]));
        setFocusedId(id);
      } else {
        setExpandedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      }
    },
    [foldedIds, following],
  );

  // ---------- Follow mode ----------

  const focusMessage = useCallback(
    (id) => {
      if (foldedIds.includes(id)) setFoldOpen(true);
      setExpandedIds(new Set([id]));
      setFocusedId(id);
      setScrollTarget({ id, kind: 'start' });
    },
    [foldedIds],
  );

  // Follow waits for the Timeline to finish loading before focusing.
  useEffect(() => {
    if (pendingFocusId && loaded.timeline) {
      focusMessage(pendingFocusId);
      setPendingFocusId(null);
    }
  }, [pendingFocusId, loaded.timeline, focusMessage]);

  // Entering Follow always uses the compact summary, so the email below gets the room.
  const startFollow = useCallback(
    (id) => {
      setMode('follow');
      setTallFollow(false);
      ensureLoaded('timeline');
      setPendingFocusId(id);
    },
    [ensureLoaded],
  );

  // Leaving Follow (for Timeline or Topics) goes back to the top, where the summary is.
  // Unselecting the followed point is different: it stays in Follow and keeps the reader's place.
  const exitFollow = useCallback(
    (nextMode) => {
      setMode(nextMode);
      setFocusedId(null);
      setPreviewId(null);
      setPendingFocusId(null);
      ensureLoaded(viewFor(nextMode));
      scrollThreadTo(0);
    },
    [ensureLoaded, scrollThreadTo],
  );

  // While following, scrolling lightly highlights the point for the email being read.
  useEffect(() => {
    if (!following || !scrollEl) return undefined;
    let frame = 0;

    const onScroll = () => {
      if (autoScrolling.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rendered = messages.filter((m) => messageEls.current.has(m.id));
        if (rendered.length === 0) return;
        const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 2;
        if (atBottom) {
          setPreviewId(rendered[rendered.length - 1].id);
          return;
        }
        const line =
          scrollEl.getBoundingClientRect().top + (stickyRef.current?.offsetHeight ?? 0) + READING_LINE;
        const current = rendered.find(
          (m) => messageEls.current.get(m.id).getBoundingClientRect().bottom > line,
        );
        if (current) setPreviewId(current.id);
      });
    };

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [following, messages, scrollEl]);

  // Original: the reply box opens at the end of the thread, like Gmail today.
  useEffect(() => {
    if (redesign || !draft.open || !scrollEl) return undefined;
    const frame = requestAnimationFrame(() => scrollThreadTo(scrollEl.scrollHeight));
    return () => cancelAnimationFrame(frame);
  }, [redesign, draft.open, scrollEl, scrollThreadTo]);

  // ---------- Handlers: reply and quotes ----------

  // "Show in thread" on a quote in the draft: open the source with a short tint.
  // Its quoted text is already outlined, since it's in the draft.
  function showDraftQuoteSource(quote) {
    reveal(quote.messageId);
    triggerFlash(quote.messageId);
    setScrollTarget({ id: quote.messageId, kind: 'source', quoteId: quote.id });
  }

  // "Show in thread" on a quote in a sent email: tint + outline the source and offer a way back.
  function showSentQuoteSource(quote, name) {
    window.clearTimeout(fadeTimer.current);
    setBackTo({ top: scrollRef.current?.scrollTop ?? 0, name, sourceId: quote.messageId });
    setTransient({ messageId: quote.messageId, text: quote.text, quoteId: quote.id });
    reveal(quote.messageId);
    setScrollTarget({ id: quote.messageId, kind: 'source', quoteId: quote.id, pill: true });
  }

  // The quote icon on a collapsed email: open it and bring its quote into view in the draft.
  function showDraftQuoteFromRow(messageId) {
    const quote = draftQuotesByMessage[messageId]?.[0];
    reveal(messageId);
    triggerFlash(messageId);
    setScrollTarget({ id: messageId, kind: 'source', quoteId: quote?.quoteId });
    if (quote) requestAnimationFrame(() => scrollDraftToQuote(quote.quoteId));
  }

  // Bring a quote into view inside the draft (the draft scrolls on its own; the thread doesn't move).
  function scrollDraftToQuote(quoteId) {
    const block = composerRef.current?.querySelector(`[data-block-id="${quoteId}"]`);
    const editor = block?.parentElement;
    if (block && editor) {
      editor.scrollTo({ top: block.offsetTop - SCROLL_GAP, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }

  function handleSend() {
    const message = draft.toMessage({
      id: `sent-${messages.length + 1}`,
      from: ME,
      to: recipientIds,
      date: NOW.toISOString(),
      rich: redesign,
    });
    if (!message) return;
    setMessages((prev) => [...prev, message]);
    setExpandedIds((prev) => new Set(prev).add(message.id));
    draft.close();
    setScrollTarget({ id: message.id, kind: 'start' });
  }

  // ---------- Handlers: summary and thread ----------

  function handleOpenSummary() {
    setSummaryOpen(true);
    ensureLoaded(viewFor(mode));
  }

  // Closing the summary resets it, so it reopens on Topics.
  function handleCloseSummary() {
    setMode('topics');
    setFocusedId(null);
    setPreviewId(null);
    setPendingFocusId(null);
    setSummaryOpen(false);
  }

  function handleModeChange(next) {
    if (next === mode) return;
    if (next === 'follow') {
      startFollow(FIRST_ID);
      return;
    }
    if (following) {
      exitFollow(next);
      return;
    }
    setMode(next);
    ensureLoaded(viewFor(next));
  }

  function handleSelectPoint(id) {
    if (following && id === focusedId) {
      setFocusedId(null); // unfocus, but keep following from where the reader is
      return;
    }
    if (following) {
      focusMessage(id);
      return;
    }
    startFollow(id);
  }

  function handleToggleMessage(id) {
    const expanding = !expandedIds.has(id);

    if (following) {
      // In Follow, opening an email makes it the one followed; others close,
      // and the email's start is brought to just below the summary.
      if (expanding) {
        setExpandedIds(new Set([id]));
        setFocusedId(id);
        setScrollTarget({ id, kind: 'start' });
      } else {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        if (id === focusedId) setFocusedId(null);
      }
      return;
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleHoverMessage(id) {
    if (following) setPreviewId(id);
  }

  return (
    <div className={styles.panel}>
      <ThreadToolbar />
      <div ref={attachScroll} className={styles.scroll}>
        <div ref={headerRef}>
          <ThreadHeader subject={thread.subject} labels={thread.labels} />
        </div>

        <div
          ref={stickyRef}
          className={[styles.summaryZone, following && styles.sticky, following && summaryStuck && styles.stuck]
            .filter(Boolean)
            .join(' ')}
        >
          <SummaryCard
            variant={variant}
            open={summaryOpen}
            mode={mode}
            loading={loadingView === viewFor(mode)}
            messagesById={messagesById}
            focusedId={focusedId}
            previewId={previewId}
            tall={tall}
            onOpen={handleOpenSummary}
            onClose={handleCloseSummary}
            onModeChange={handleModeChange}
            onSelectPoint={handleSelectPoint}
            onToggleTall={() => (following ? setTallFollow((t) => !t) : setTallBrowse((t) => !t))}
          />
        </div>

        <MessageList
          messages={messages}
          messagesById={messagesById}
          foldedIds={foldedIds}
          foldOpen={foldOpen}
          expandedIds={expandedIds}
          draftQuotesByMessage={redesign ? draftQuotesByMessage : {}}
          transient={transient}
          flash={flash}
          followedId={following ? focusedId : null}
          hoveredQuoteId={hoveredQuoteId}
          onOpenFold={() => setFoldOpen(true)}
          onToggle={handleToggleMessage}
          onHover={handleHoverMessage}
          onShowSource={redesign ? showSentQuoteSource : undefined}
          onShowDraftQuote={showDraftQuoteFromRow}
          onHoverQuote={setHoveredQuoteId}
          onClickDraftMark={scrollDraftToQuote}
          registerMessage={registerMessage}
        />

        {draft.open ? (
          <Composer
            variant={variant}
            recipient={recipientIds.map((id) => people[id].name).join(', ')}
            replyAll={replyAll}
            onToggleReplyAll={() => setReplyAll((all) => !all)}
            draft={draft}
            messagesById={messagesById}
            wrapRef={composerRef}
            hoveredQuoteId={hoveredQuoteId}
            onHoverQuote={setHoveredQuoteId}
            onSend={handleSend}
            onDiscard={draft.close}
            onShowSource={showDraftQuoteSource}
          />
        ) : (
          <ReplyBar onReply={draft.start} />
        )}
      </div>

      {backTo && (
        <button
          type="button"
          className={`${styles.backPill} ${backTo.fading ? styles.backPillFading : ''}`}
          onClick={() => {
            scrollThreadTo(backTo.top);
            dismissBack();
          }}
        >
          <Icon name="arrow_downward" size={18} />
          Back to {backTo.name}
        </button>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <QuotePopup
        enabled={redesign}
        draftOpen={draft.open}
        scrollContainer={scrollEl}
        onQuote={draft.insertQuote}
      />
    </div>
  );
}
