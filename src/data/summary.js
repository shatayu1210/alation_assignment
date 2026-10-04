// Static AI summary content. In a real product this would come from Gemini.
// "You" refers to the viewer (Arjun).

// Topics: grouped points. One point can draw on several emails, so they aren't linked.
// Note for the demo: point t4 (Topics) and the m9 point (Timeline) both say "first year",
// while email m9 says "first quarter". It shows the kind of mistake Follow lets people catch.
export const topicPoints = [
  {
    id: 't1',
    text: 'Launch is set for Tuesday, Oct 20, with a press briefing on Oct 19.',
    attachment: 'Lumen 2.0 Launch Brief.pdf',
  },
  {
    id: 't2',
    text: 'The new dashboard ships behind a feature flag: 10% of users on launch day, ramping up over a week. The press demo will use a test account with the flag on.',
  },
  {
    id: 't3',
    text: 'Your migration dry run took 14 hours, so the real run starts Friday evening, Oct 16.',
  },
  {
    id: 't4',
    text: 'Your 3x load test passed with p95 latency under 400ms, and $2,500/month for extra capacity is approved for the first year. The export endpoint slowed past 2.5x.',
  },
  {
    id: 't5',
    text: 'Open asks for you: publish the API docs by Oct 14 and look into the export endpoint before launch.',
  },
];

// Timeline: one point per email, in order, linked by messageId.
export const timelinePoints = [
  { messageId: 'm1', text: 'Priya kicked off launch planning for Oct 20 and shared the launch brief.' },
  { messageId: 'm2', text: 'Sarah said the onboarding designs are ready and asked whether the dashboard ships behind a flag.' },
  { messageId: 'm3', text: 'You reported the insights API is about 80% done and flagged the weekend-long data migration as the main risk. You recommended shipping the dashboard behind a feature flag so it can be rolled back quickly.' },
  { messageId: 'm4', text: 'Marcus booked the press briefing for Oct 19 and asked if the platform can handle a 3x traffic spike.' },
  { messageId: 'm5', text: 'Elena asked you to run a load test at 3x normal traffic and share the results by Oct 9. She offered to get budget approved the same week if more capacity is needed.' },
  { messageId: 'm6', text: 'Priya agreed on the flag: 10% rollout on launch day, ramping up over a week.' },
  { messageId: 'm7', text: 'Sarah will add a short dashboard tour for users who have the flag on.' },
  { messageId: 'm8', text: 'You found the migration dry run took 14 hours, longer than planned, so the real run has to start Friday evening, Oct 16, to finish safely before launch.' },
  { messageId: 'm9', text: 'Elena got $2,500/month approved for extra capacity for the first year after launch.' },
  { messageId: 'm10', text: 'Marcus said the PR agency needs a customer quote by Oct 12 and wants the new dashboard in the press demo.' },
  { messageId: 'm11', text: 'Priya said the demo can use a flagged test account and asked you to publish the API docs by Oct 14.' },
  { messageId: 'm12', text: 'Elena shared the load test results: 3x traffic held with p95 latency under 400ms, but the export endpoint slowed down past 2.5x. She asked you to look into it before launch.' },
];
