// Mock thread for the prototype. "me" is Arjun, a backend engineer on the launch.
// The demo's "current time" is fixed so relative dates ("3 days ago") never drift.
export const NOW = new Date('2026-10-02T12:30:00');

export const ME = 'arjun';

export const people = {
  priya: { name: 'Priya Shah', email: 'priya.shah@example.com', color: '#0b57d0' },
  sarah: { name: 'Sarah Kim', email: 'sarah.kim@example.com', color: '#b3261e' },
  arjun: { name: 'Arjun Rao', email: 'arjun.rao@example.com', color: '#146c2e' },
  marcus: { name: 'Marcus Lee', email: 'marcus.lee@example.com', color: '#8e4ec6' },
  elena: { name: 'Elena Torres', email: 'elena.torres@example.com', color: '#00796b' },
};

const team = ['priya', 'sarah', 'arjun', 'marcus', 'elena'];
const everyoneBut = (id) => team.filter((p) => p !== id);

export const thread = {
  subject: 'Lumen 2.0 launch: plan and open questions',
  labels: ['Inbox'],
  messages: [
    {
      id: 'm1',
      from: 'priya',
      to: everyoneBut('priya'),
      date: '2026-09-21T09:12:00',
      attachment: 'Lumen 2.0 Launch Brief.pdf',
      body: [
        'Hi all,',
        'Kicking off launch planning for Lumen 2.0. Our target launch date is Tuesday, Oct 20.',
        'Please share your team’s status and any risks by end of week. The launch brief is attached.',
        'Thanks,\nPriya',
      ],
    },
    {
      id: 'm2',
      from: 'sarah',
      to: everyoneBut('sarah'),
      date: '2026-09-21T14:40:00',
      body: [
        'Design is in good shape. The final onboarding screens are ready for review.',
        'One open question: are we shipping the new dashboard layout to everyone on day one, or behind a feature flag?',
      ],
    },
    {
      id: 'm3',
      from: 'arjun',
      to: everyoneBut('arjun'),
      date: '2026-09-22T10:05:00',
      body: [
        'Backend status: the new insights API is about 80% done.',
        'The main risk is the data migration, which needs a full weekend run. I’d recommend shipping the dashboard behind a flag so we can roll back quickly if something breaks.',
      ],
    },
    {
      id: 'm4',
      from: 'marcus',
      to: everyoneBut('marcus'),
      date: '2026-09-22T16:18:00',
      body: [
        'The marketing plan is drafted, and the press briefing is booked for Oct 19, the day before launch.',
        'We’re expecting a big traffic spike from the announcement, maybe 3x normal. Can the platform handle that?',
      ],
    },
    {
      id: 'm5',
      from: 'elena',
      to: everyoneBut('elena'),
      date: '2026-09-23T11:30:00',
      body: [
        'Good flag, Marcus.',
        'Arjun, can you run a load test at 3x traffic and share the results by Oct 9? If we need more capacity, I’ll get the budget approved this week.',
      ],
    },
    {
      id: 'm6',
      from: 'priya',
      to: everyoneBut('priya'),
      date: '2026-09-24T09:47:00',
      body: [
        'Agreed on the feature flag for the dashboard.',
        'Sarah, let’s plan a 10% rollout on launch day and ramp up to everyone over a week.',
      ],
    },
    {
      id: 'm7',
      from: 'sarah',
      to: everyoneBut('sarah'),
      date: '2026-09-24T13:15:00',
      body: [
        'Works for me. I’ll update onboarding so new users see a short tour of the dashboard when the flag is on.',
      ],
    },
    {
      id: 'm8',
      from: 'arjun',
      to: everyoneBut('arjun'),
      date: '2026-09-25T18:02:00',
      body: [
        'The migration dry run finished, but it took 14 hours, longer than we planned.',
        'We’ll need to start the real run on Friday evening, Oct 16, to finish safely before launch.',
      ],
    },
    {
      id: 'm9',
      from: 'elena',
      to: everyoneBut('elena'),
      date: '2026-09-28T10:20:00',
      body: [
        'Thanks, Arjun.',
        'The budget for extra capacity is approved: $2,500/month for the first quarter after launch.',
      ],
    },
    {
      id: 'm10',
      from: 'marcus',
      to: everyoneBut('marcus'),
      date: '2026-09-29T15:44:00',
      body: [
        'Quick update from the PR agency: they need a final customer quote by Oct 12.',
        'They’d also like the press demo to show the new dashboard, even though it’s flagged for most users. Is that possible?',
        'For context, here’s the full plan from their side. The briefing on Oct 19 is with six outlets, mostly enterprise tech press. Each reporter gets a 20-minute live demo, followed by Q&A with Priya. The agency wants the demo to open on the new dashboard because it’s the most visual part of the launch, and it’s what they’ve pitched in the invites.',
        'They’ve also asked for a few things from us by Oct 14: two or three screenshots of the dashboard with realistic sample data, a one-paragraph description of what’s new in 2.0 written for a non-technical audience, and confirmation of who will run the demo on the day.',
        'On the customer quote, they’d like it from one of our design partners, ideally someone who has used the beta for at least a month. Sarah, could you suggest two or three names from the onboarding interviews? I’ll reach out once we have a shortlist.',
        'Last thing: the agency pointed out that reporters often try the product themselves right after a briefing. If the dashboard is flagged off for new sign-ups, we should decide what they’ll see, or have a short note ready that explains the rollout.',
        'Thanks,\nMarcus',
      ],
    },
    {
      id: 'm11',
      from: 'priya',
      to: everyoneBut('priya'),
      date: '2026-09-30T09:05:00',
      body: [
        'The demo can use a test account with the flag turned on.',
        'Arjun, one more ask: can we get the API docs published by Oct 14 so partners have time to prepare?',
      ],
    },
    {
      id: 'm12',
      from: 'elena',
      to: everyoneBut('elena'),
      date: '2026-10-01T16:30:00',
      body: [
        'Load test results are in: we held 3x traffic with p95 latency under 400ms. Nice work.',
        'One concern: the export endpoint slowed down noticeably past 2.5x. Arjun, can you look into it before launch?',
        'Elena',
      ],
    },
  ],
};
