// Gmail folds the middle of long threads into a numbered circle.
// It keeps the first email and the last few visible.
const VISIBLE_AT_END = 4;
const MIN_TO_FOLD = 7;

export function getFoldedIds(messages) {
  if (messages.length < MIN_TO_FOLD) return [];
  return messages.slice(1, messages.length - VISIBLE_AT_END).map((m) => m.id);
}
