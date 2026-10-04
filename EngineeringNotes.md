# Gmail Threading Redesign: Design Notes

My answers to how I approached this redesign: the users, the problems, why I picked the ones I did, and the thinking behind each solution. The working prototype is in this repo; see the [README](README.md) for how to run it.

## 1. Understand the users and their goals

### Who uses threads

Threads show up anywhere there's back and forth between two or more people. Three setups come up most often:

1. Two people, like a customer and a support agent sorting out an issue.
2. A small, active group, like a team brainstorming or an engineering discussion where everyone chips in.
3. A big group with mixed involvement, where a few people do the work and others are copied in to stay aware.

The same person can be in all three setups in one day, so what they need depends on the moment, not just on who they are.

### What they're trying to do when they open a thread

1. Catch up on what happened and where things stand, so they can respond without rereading everything.
2. Find something specific, like a decision or a date, without scrolling and opening every message.
3. Reply to several points from different people in one email, quoting each one clearly so everyone knows what they're responding to.
4. Track who owes what, for PMs and team leads who need to follow up without building the list by hand.
5. Know what's needed from them, so they can act on it or safely skip the rest.

## 2. Identify the key problems

### Problem 1: The AI summary is hard to trust and hard to follow

**Goals affected:** catching up and finding something specific.

1. **It's hard to trust.** Summary points aren't linked to the messages they came from, and they have no dates. Checking a point means finding the original message by hand, so people either trust the AI blindly or reread the thread anyway.
2. **It has one fixed format.** There's no way to switch between a summary grouped by topic and a message by message view of how things unfolded.

**Evidence**

1. Google's own help page warns that Gemini "may suggest inaccurate or inappropriate information," but the summary gives no way to check a point against its source. The same page mentions reminders for tasks with a due date, with nothing on who each task belongs to. ([Google Help Page](https://support.google.com/mail/answer/16561387))
2. Microsoft's Work Trend Index Special Report revealed that knowledge workers now receive an average of 117 emails daily and face notifications every two minutes. ([Microsoft News Center Report](https://news.microsoft.com/de-ch/2025/06/17/new-microsoft-study-reveals-the-rise-of-the-infinite-workday-40-of-employees-check-email-before-6-a-m-evening-meetings-up-16/))

### Problem 2: Replying to several points in a thread is clunky

**Goal affected:** replying to several points.

1. **It takes too many steps.** Quoting from different messages means copying from one, scrolling down to the draft, pasting, formatting it as a quote, then scrolling back up and repeating for every point.
2. **Quotes lose their context.** A pasted quote is plain text, with no clear sign of who said it or when, and no way back to the full original message.

**Evidence**

1. Gmail once graduated a "Quote selected text" feature, where highlighting text and hitting Reply quoted only that text. Google moved it back to Labs after 50 days because people kept quoting text they had selected by accident. ([The Next Web](https://thenextweb.com/news/google-retracts-gmails-new-quote-selected-text-feature-and-puts-it-back-into-labs-after-50-days))
2. Users continue to ask on official Google help forums how to reply inline or quote specific parts of a message, noting that managing full thread histories manually is tedious. ([Gmail Help Community Thread](https://support.google.com/mail/thread/4022280/how-do-i-reply-inline?hl=en))

### Other problems I found

1. **Nothing inside a thread shows what's needed from you.** AI Inbox (beta) suggests to-dos across the whole inbox, and Gmail can suggest reminders for tasks with a due date, but the thread itself doesn't show which requests are yours or who owes what.
2. **In long threads, the subject scrolls out of view,** so people scroll back up to check what the thread is about.

## 3. Prioritize

### How I decided

I weighed each problem on four things:

1. **Reach:** how many people have it.
2. **Frequency:** how often it happens.
3. **Cost:** how much time or risk it adds each time.
4. **Fit:** whether I can solve it well in the time I have.

| | Summary (Problem 1) | Quoting (Problem 2) | Action items | Sticky subject |
|---|---|---|---|---|
| **Reach** | High: anyone reading a long thread | High: anyone replying in a group thread, no AI needed | Medium: mostly people coordinating | High: every long thread |
| **Frequency** | High: every time a long thread is opened | Medium: whenever a reply covers several points | Medium: busy work threads | High: every long thread |
| **Cost** | High: a wrong point can mislead, and checking means rereading | Medium: many steps per reply, and quotes lose who said what | High: missed requests | Low: a quick scroll up |
| **Fit** | Good: builds on the existing summary | Good: stays within the thread and reply box | Poor: needs reliable assignment, constant updates | Good, but low impact for the space it takes |

### What I'm solving

1. **The AI summary is hard to trust and hard to follow.** A summary is only useful if people can trust it, and today checking a point means rereading the thread. Linking each point to its email, and letting the summary follow along as people read, fixes that for anyone reading a long thread. Google says thread summaries are available to all Gmail users, so this reaches everyone.
2. **Replying to several points is clunky.** It happens in the threads that matter most, the busy multi-person ones. Today it takes many steps, and the quotes lose who said what. Google's own attempt shows the need is real, and also what to avoid: quoting has to be a clear, deliberate action, not something that happens by accident. It needs no AI, so it helps every user.

### What I'm not solving now, and why

1. **Action items inside the thread.** This would cover knowing what's needed from you and tracking who owes what. But to stay accurate, the list would need to update automatically after every new reply, so it never goes out of date. And it mostly helps people coordinating busy threads, while the summary and quoting help everyone.
2. **Sticky subject.** Real, but low cost each time, usually a quick scroll back up. A good next step would be a slim bar that keeps the subject in view while scrolling. If a reply changed the subject, it would show "Subject A… → Subject B…" as you scroll past that point, with the full text in a tooltip on hover. It would also take up a little space at the top of every thread, so I'd want to test whether people find it worth that space.

## 4. Design a solution

Both solutions follow one idea: every summary point and every quote stays connected to the email it came from, one click away.

### Solution 1: A summary you can trust and follow

1. **Goal:** catch up quickly, and check any point when it matters.
2. **Gap:** the summary is one fixed list, with no dates and no link to where each point came from.
3. **Decision:** keep today's summary as the default, and add two deeper views behind one switch: Topics, Timeline, and Follow.

**What it does**

1. Topics is today's grouped summary, unchanged.
2. Timeline gives one point per email, in order, with a short date. Hovering the date shows the full date and time.
3. Follow pins the summary to the top and opens each point's email right below it. Clicking a point starts Follow there; choosing Follow starts from the first email. Only the followed email stays open.
4. While following, the summary scrolls along with the reader and lightly highlights the point for the email in view.
5. The summary stays compact, about four points, with Show more. Follow always starts compact, and Timeline remembers its own setting.

**Alternatives I considered**

1. Opening the source email in an overlay. It covers the thread and has to be closed again, so I chose to open the email in place.
2. A separate Follow button, or a second switch for detail level. That meant overlapping controls for nearly the same thing. One switch reads as a natural progression: overview, then detail, then reading alongside the source.
3. Starting Follow at the newest email. In testing, the jump to the bottom of the thread was disorienting.

**Tradeoffs I accepted**

1. Points link to emails only in Timeline and Follow, since one Topics point can come from several emails.
2. Someone deep in a thread scrolls up once to start Follow. After that, the summary stays in view.

### Solution 2: Quote from any message

1. **Goal:** reply clearly to several points from different people.
2. **Gap:** quoting means copying, scrolling, and pasting, and pasted quotes lose who said what and when.
3. **Decision:** make quoting a deliberate action on selected text, and keep every quote linked to its source.

**What it does**

1. Selecting text shows Draft a reply, or Add to draft once a draft is open. The Reply button works as before.
2. Each quote shows the sender, date, and time. Clicking it shows the source in the thread.
3. While drafting, quoted text stays highlighted in the thread, and collapsed emails show an In draft label, so nothing gets quoted twice. Already-quoted text can't be selected again.
4. In the draft, a quote acts like one character: the arrow keys move around it, Backspace removes it after a confirmation, and undo brings it back.
5. The reply goes to everyone in the thread by default, or only to the people quoted.
6. After sending, quotes stay linked, with a Back to your reply button.

**Alternatives I considered**

1. Quoting selected text automatically on Reply. Google pulled this from Gmail because people quoted by accident.
2. Shrinking the reply box while scrolling. I tried it, and quotes became hard to read.
3. A remove button on each highlight in the thread. I tried it, and it overlapped the text. Quotes are removed from the draft instead.

**Tradeoffs I accepted**

1. Rich interactive quote cards exist within Gmail. For recipients using external clients like Microsoft Outlook or Apple Mail, quotes gracefully fall back to standard HTML blockquotes with clear sender, date, and time headers so readability is preserved everywhere.
2. The draft is built from text and quote blocks, not a full rich-text editor. That keeps the prototype simple and reliable.

### Consistency and details

1. **One visual language:** grey for hover, blue for active or linked items, and neutral grey for quotes so they never look like AI content.
2. **Every state is designed:** loading, empty, hover, active, and keyboard focus.
3. **Accessibility:** real buttons and labels, keyboard support for the main flows, active states that don't rely on color alone, and the system's reduce motion setting respected.

### How I'd check it works

1. Automated tests with Jest and React Testing Library for the draft and summary logic, plus a few end-to-end tests for the keyboard flows.
2. A short task test with about five people: "find when the budget was approved and for how long" and "reply to two people's points in one email."

## The prototype

The prototype is a React app in this repo. A switch at the top compares today's Gmail ("Changes removed") with the redesign ("Changes applied"), so both versions can be tried side by side. See the [README](README.md) for how to run it and what to try.

## Demo video

[Watch the walkthrough](https://drive.google.com/file/d/1GIXl_dyqVZf7TrLzPv0ast4Hjnqb7xm4/view?usp=share_link)