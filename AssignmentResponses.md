# Gmail Threading Redesign: Assignment Responses

My answers to the six steps of the UX Engineer design exercise. The working prototype is in this repo; see the [README](README.md) for how to run it.

## 1. Understand the users and their goals

*Who uses Gmail threading, and what are they trying to do? Think about the different contexts, workflows, and user types.*

### Who uses threads

Threads show up anywhere there's back and forth between two or more people. Three setups come up most often:

1. Two people, like a customer and a support agent sorting out an issue.
2. A small, active group, like a team brainstorming or an engineering discussion where everyone chips in.
3. A big group with mixed involvement, where a few people do the work and others are copied in to stay aware.

The same person can be in all three setups in one day, so what they need depends on the moment, not just on who they are.

### What they're trying to do when they open a thread

1. **Catch up** on what happened and where things stand, so they can respond without rereading everything.
2. **Know what's needed from them,** so they can act on it or safely skip the rest.
3. **Track who owes what,** for PMs and team leads who need to follow up without building the list by hand.
4. **Reply to several points** from different people in one email, quoting each one clearly so everyone knows what they're responding to.
5. **Find something specific,** like a decision or a date, without scrolling and opening every message.

## 2. Identify the key problems

*Given those user goals, where does the current threading model get in the way?*

### Problem 1: The AI summary is hard to trust and hard to follow

Goals affected: catching up and finding something specific.

1. **It's hard to trust.** Summary points aren't linked to the messages they came from, and they have no dates. Checking a point means finding the original message by hand, so people either trust the AI blindly or reread the thread anyway.
2. **It has one fixed format.** There's no way to switch between a summary grouped by topic and a message-by-message view of how things unfolded.

**Evidence**

1. Google's own help page warns that Gemini "may suggest inaccurate or inappropriate information," but the summary gives no way to check a point against its source. The same page mentions reminders for tasks with a due date, with nothing on who each task belongs to. (support.google.com/mail/answer/16561387)
2. Reviewers note that summaries can miss context, and that trusting them without checking the original emails is a gamble. (eesel.ai; SlashGear, "I Tried Gemini For My Email. Here's Why I Don't Trust It")
3. Security researchers showed that hidden text in an email can make the Gemini summary display a fake warning. Linking each point to its source would let people check what the summary claims. (0DIN, reported by BleepingComputer and Yahoo Tech)
4. In a Gated survey, 82% of people said they miss important emails because their inboxes are bogged down (HR Dive). In a Workfront survey, 55% of workers said following conversations through long threads is a problem (CNBC).
5. In my own testing, the AI Overview appeared automatically at the top of some threads, and to-dos only showed up in AI Inbox, not inside the thread. On one real thread, the overview said the recruiter was "noting potential role requires no sponsorship," when she had actually said the company isn't in a position to sponsor. With no link back to the source message, there's no quick way to catch a mistake like that.

### Problem 2: Replying to several points in a thread is clunky

Goal affected: replying to several points.

1. **It takes too many steps.** Quoting from different messages means copying from one, scrolling down to the draft, pasting, formatting it as a quote, then scrolling back up and repeating for every point.
2. **Quotes lose their context.** A pasted quote is plain text, with no clear sign of who said it or when, and no way back to the full original message.

**Evidence**

1. Gmail once graduated a "Quote selected text" feature, where highlighting text and hitting Reply quoted only that text. Google moved it back to Labs after 50 days because people kept quoting text they had selected by accident. (The Next Web)
2. People still ask how to reply inline or quote part of a message in Gmail, and later reported the old Labs feature had stopped working. (Gmail Users Google Group; gtricks.com comments, 2017 and 2019)
3. In my own testing, selecting text and clicking Reply cleared the selection and opened a blank draft, and there's no way to quote from several messages at once.

### Other problems I found

1. **Nothing inside a thread shows what's needed from you.** AI Inbox (beta) suggests to-dos across the whole inbox, and Gmail can suggest reminders for tasks with a due date, but the thread itself doesn't show which requests are yours or who owes what.
2. **People added partway through get the earlier conversation as one long block** of quoted text inside a single email, which is nested and hard to scan.
3. **In long threads, the subject scrolls out of view,** so people scroll back up to check what the thread is about.

## 3. Prioritize

*Pick the top 1-3 problems to focus on. Explain why these are the ones that matter most. We want to see how you think about impact, scope, and what's worth doing.*

### How I decided

I weighed each problem on four things:

1. **Reach:** how many people have it.
2. **Frequency:** how often it happens.
3. **Cost:** how much time or risk it adds each time.
4. **Fit:** whether I can solve it well in the time I have.

### What I'm solving

1. **The AI summary is hard to trust and hard to follow.** A summary is only useful if people can trust it, and today checking a point means rereading the thread. Linking each point to its email, and letting the summary follow along as people read, fixes that for anyone reading a long thread.
2. **Replying to several points is clunky.** It happens in the threads that matter most, the busy multi-person ones. Today it takes many steps, and the quotes lose who said what. Google's own attempt shows the need is real, and also what to avoid: quoting has to be a clear, deliberate action, not something that happens by accident.

Both solutions share one idea: every AI point and every quote stays connected to the email it came from, one click away.

On reach: Google says thread summaries are available to all Gmail users. In my testing, the AI Overview appeared automatically on some threads, but not on a free account. Problem 2 needs no AI at all, so it helps every user.

### What I'm not solving now, and why

1. **Action items inside the thread.** This would cover knowing what's needed from you and tracking who owes what. But to stay accurate, the list would need to refresh after every new reply, which adds cost and delay. It also raises questions a prototype can't answer: whether the AI assigned each task to the right person, and whether people should see items from emails they never received. And it mostly helps people coordinating busy threads, while the summary and quoting help everyone. It's the first thing I'd build next.
2. **History for people added late.** This could be solved without AI by splitting the quoted history into separate message cards. But every email app formats quoted history differently. Gmail and Apple Mail write "On [date], [name] wrote:", Outlook uses a From, Sent, To, Subject block, and each changes by language. Doing it reliably is harder than it looks.
3. **Sticky subject.** Real, but low cost each time, usually a quick scroll back up. A good next step would be a slim bar that keeps the subject in view while scrolling, showing "Subject A… → Subject B…" if a reply changed the subject, with the full text in a tooltip.

## 4. Design a solution

*Show your design rationale. Why this approach? What alternatives did you consider? What tradeoffs are you making? We should be able to follow your thinking from user goal, to gap, to design decision.*

### Solution 1: A summary you can trust and follow

**Goal:** catch up quickly, and check any point when it matters.
**Gap:** the summary is one fixed list, with no dates and no link to its sources.
**Decision:** keep today's summary as the default, and add two deeper views behind one switch.

**How it works**

1. **One switch with three views:** Topics, Timeline, and Follow. Each goes one step deeper, so the summary stays quick by default and detailed only when someone asks for it.
2. **Topics** is today's grouped summary, unchanged, for a quick catch-up.
3. **Timeline** gives one point per email, in order, each starting with a short date. Hovering the date shows the full date and time.
4. **Follow** pins the summary to the top of the thread and opens each point's email right below it, so the point and its source are always side by side.
   - It starts from the first email, or from whichever Timeline point was clicked.
   - Only the followed email is open, and it gets a faint blue tint.
   - The active point is a light blue pill with a thin darker outline, so it doesn't rely on color alone.
   - As the reader scrolls, the point for the email they're reading is lightly highlighted, and the summary scrolls along with them.
   - Clicking the active point again unselects it without moving anything. Switching to Topics or Timeline goes back to the top.
5. **Compact by default:** the summary shows about four points, with a fade and a "Show more" button when there's more.

**Alternatives I considered**

1. **Opening the source email in an overlay.** Rejected: it covers the thread and breaks the reading flow. Following keeps everything in one place.
2. **A separate Follow button in the toolbar.** It would stay reachable after the summary scrolls away, but it meant two overlapping controls for nearly the same thing. One switch reads as a clear progression from overview, to detail, to reading alongside the source.
3. **Starting Follow at the newest email.** Rejected after testing: the sudden jump to the bottom of the thread was disorienting. Starting from the first email feels natural.
4. **A blue outline for the active point.** Rejected: it looked like the keyboard focus ring. A filled pill with a thin outline is clearer.

**Tradeoffs I accepted**

1. Someone deep in a thread scrolls back up once to turn Follow on. From then on, the summary stays in view.
2. Points link to emails only in Timeline and Follow, since one Topics point can come from several emails.

### Solution 2: Quote from any message

**Goal:** reply to several points from different people, clearly.
**Gap:** quoting means copying, scrolling, and pasting, and pasted quotes lose who said what and when.
**Decision:** make quoting a deliberate action on selected text, and keep every quote linked to its source.

**How it works**

1. **Select text in any email** and a small button appears: "Draft a reply" if no draft is open, or "Add to draft" if one is. The Reply button doesn't change and still opens a blank draft.
2. **Each quote shows the sender, the date and time,** and a neutral grey bar. Clicking a quote in the draft shows its source in the thread.
3. **Quoted text stays highlighted in the thread** while the draft is open, so the writer doesn't quote it twice. Hovering a quote in the draft darkens its highlight in the thread, and the other way round.
4. **Collapsed emails with a quote in the draft show an "In draft" label.** Clicking the email opens it and scrolls the draft to that quote.
5. **Already-quoted text can't be selected again,** so quotes never nest or overlap.
6. **The draft treats a quote like one character of text.** The cursor can sit before or after it and move across it with the arrow keys. Shift+Arrow selects it. Backspace asks for confirmation before removing it, unless it was selected first. Undo and redo work for quote changes.
7. **The reply box stays pinned at the bottom.** It can be resized with a drag handle, but never so tall that the subject disappears. Scrolling over it never scrolls the thread behind it.
8. **The reply goes to everyone in the thread by default.** One click narrows it to only the people quoted.
9. **After sending, quotes stay linked.** Clicking one opens its source with a highlight and a "Back to your reply" button, which goes away once the reader goes back or scrolls the source out of view.

**Alternatives I considered**

1. **Quoting selected text automatically on Reply,** like Gmail's old Labs feature. Rejected: Google pulled it because people quoted text by accident.
2. **Shrinking the reply box while scrolling the thread.** Tried and rejected: at the smaller size, quotes were hard to read and there was no space to click into.
3. **A remove button on each highlight in the thread.** Tried and rejected: the buttons overlapped text and other highlights. Quotes are removed from the draft instead, and hovering shows which highlight belongs to which quote.

**Tradeoffs I accepted**

1. The rich quote styling only exists in Gmail. The sent email would fall back to a standard quote with a line like "On Sep 29, Marcus wrote:", so it still reads fine in Outlook or Apple Mail.
2. The draft is built as a list of blocks (text, quote, text) instead of a full rich-text editor. That keeps quoting simple and reliable in a prototype; in production I'd use an editor framework where quotes are built-in nodes.

### How I'd validate these

1. **Check the problem with more people:** ask 5 to 8 people who live in long threads how they catch up and how they quote today.
2. **Test the prototype on tasks:** "find when the budget was approved and for how long," and "reply to two people's points in one email." Compare time and confidence against today's Gmail.
3. **Measure in real use:** how often people open Timeline and Follow, how many quotes go into each reply, and whether people check the source of a summary point before acting on it.

## 5. Build a working prototype

*Create a functional frontend prototype in React or HTML/CSS/JS.*

The prototype is a React app in this repo. A switch at the top compares today's Gmail ("Changes removed") with the redesign ("Changes applied"), so both versions can be tried side by side. See the [README](README.md) for how to run it and what to try.

## 6. Demo it

*Record a short walkthrough (5-7 minutes max) showing your solution and talking through your decisions.*

Demo video: [add link]
