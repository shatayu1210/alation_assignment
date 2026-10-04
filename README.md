# Gmail Threading Redesign

> **Looking for the design notes?** The reasoning behind these two solutions, the users, the problems, and the tradeoffs, is in **[EngineeringNotes.md](EngineeringNotes.md)**.

A React prototype of two improvements to Gmail's threading experience.

## The two problems

1. **The AI summary is hard to trust and hard to follow.** Gmail's AI Overview gives a few points for a long thread, with no dates and no way to check where a point came from.
2. **Replying to several points is clunky.** Quoting from different emails means copying, scrolling, and pasting, and the pasted quotes lose who said what and when.

Both solutions share one idea: every summary point and every quote stays connected to the email it came from.

## Demo video

[Watch the walkthrough](https://drive.google.com/file/d/1GIXl_dyqVZf7TrLzPv0ast4Hjnqb7xm4/view?usp=share_link)

## Run it

You'll need Node 20.19 or newer.

```bash
npm install
npm run dev
```

Then open the address Vite prints, usually http://localhost:5173.

## Compare before and after

The switch next to the search bar flips between two versions of the same thread:

- **Changes removed:** today's Gmail. This is where the page starts.
- **Changes applied:** the redesign.

Switching resets the thread, so each version starts fresh.

## What to try

Turn on **Changes applied** first.

### The summary (Problem 1)

1. Click **AI Overview** above the thread. It opens on **Topics**, today's grouped summary.
2. Switch to **Timeline** to see one point per email, in order. Hover a date for the full date and time.
3. Click any point. This turns on **Follow**: the summary stays pinned at the top, and that email opens right below it.
4. Scroll through the thread. The point for the email you're reading is lightly highlighted, and the summary scrolls along with you.
5. Click the **Sep 28** point. The point says the budget is approved "for the first year," but the email right below it says "for the first quarter." This is the kind of AI mistake Follow makes easy to catch.
6. Choose **Topics** or **Timeline** to stop following and go back to the top.

### Quoting (Problem 2)

1. Open any email and select some text. Click **Draft a reply**.
2. Open another email, select text, and click **Add to draft**.
3. Notice the quoted text stays highlighted in the thread, and collapsed emails with a quote show an **In draft** label.
4. Hover a quote in the draft to see its highlight in the thread darken. Click the quote to jump to its source.
5. In the draft, use the arrow keys around a quote, try **Backspace** on it, then **Cmd/Ctrl+Z** to bring it back.
6. Use the people icon in the reply header to switch between replying to everyone and replying to only the people you quoted.
7. Send the reply, then click a quote in the sent email to jump to its source. Use **Back to your reply** to return.

## Design decisions in short

The full reasoning, alternatives, and tradeoffs are in [EngineeringNotes.md](EngineeringNotes.md). The main calls:

1. **Quick by default, detailed on request.** Topics stays as today's summary. Timeline and Follow are one click deeper, behind a single switch.
2. **Follow instead of a pop-up.** The source email opens in place, right under its summary point, so reading never jumps to an overlay.
3. **Quoting is a deliberate action.** Gmail once quoted selected text automatically on Reply and pulled the feature because people quoted by accident. Here, quoting is its own button, and Reply still works as usual.
4. **Quotes stay linked everywhere:** in the draft, in the thread while drafting, and in the sent email.
5. **Accessibility from the start:** real buttons and labels, keyboard support for the switch and for quotes in the draft, active states that don't rely on color alone, and respect for the system's reduce motion setting.

## How it's built

React, Vite, and CSS Modules with shared design tokens. No other libraries.

```
src/
  components/
    common/    Reusable pieces: buttons, tooltips, the switch, skeleton loading
    shell/     The static Gmail frame: top bar, side navigation, app rail
    thread/    The thread: toolbar, emails, folded emails, reply bar
    summary/   The AI Overview and its points
    compose/   The reply box, quote blocks, and the quote popup
  hooks/       useDraft (the reply's text and quotes, with undo and redo)
  data/        The mock thread and summary
  styles/      Design tokens and global styles
  utils/       Date formatting and thread helpers
```

A few notes on the approach:

- **State lives in one place.** `ThreadView` owns the thread and summary state. The reply draft lives in the `useDraft` hook.
- **The draft is a list of blocks** (text, quote, text) rather than a full rich-text editor, which keeps quoting simple and reliable.
- **Scroll syncing** uses the browser's IntersectionObserver and requestAnimationFrame, so it stays smooth.

## If this were going to production

The AI summaries and saved drafts would come from Gmail's existing services; this prototype uses mock data. On the frontend, I'd change these:

| In the prototype | In production |
|---|---|
| Reply box built from text areas and quote blocks | A rich-text editor framework such as ProseMirror or Lexical, with quotes as built-in elements |
| Quotes found in the source email by matching text | Quotes saved with their exact position, so repeated phrases and formatting don't confuse them |
| Email bodies are plain text | Real HTML email, with highlights placed on the rendered content |
| Every email in the thread is rendered | Only visible emails are rendered, so threads with hundreds of emails stay fast |
| Basic accessibility | A full screen reader pass, including announcing changes in Follow |
| No automated tests | Unit tests for the draft logic, component tests, and end-to-end tests for the keyboard flows |

## Notes

- Only the parts being demonstrated are interactive. The rest of the Gmail frame is there for context.
- All emails, people, and summaries are made up.
- Fonts and icons are open source (Roboto and Material Symbols). The Gmail logo isn't included because it's a Google trademark. If you add `public/gmail-logo.png` yourself, the app uses it; otherwise it shows a plain mail icon.
- AI coding tools helped speed up the build. The design decisions and tradeoffs are my own.
