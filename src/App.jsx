import { useCallback, useState } from 'react';
import { GmailShell } from './components/shell/GmailShell';
import { ThreadView } from './components/thread/ThreadView';

export default function App() {
  // Demo switch: compare today's Gmail ("Changes removed") with the redesign ("Changes applied").
  // Switching remounts the thread, so each version starts from its landing state.
  const [changesApplied, setChangesApplied] = useState(false);
  const variant = changesApplied ? 'redesign' : 'original';

  // Whether the folded older emails have been opened. Kept here, above the remount,
  // so the thread stays expanded when switching versions; it resets only on page reload.
  const [foldOpen, setFoldOpen] = useState(false);
  const openFold = useCallback(() => setFoldOpen(true), []);

  return (
    <GmailShell
      changesApplied={changesApplied}
      onToggleChanges={() => setChangesApplied((applied) => !applied)}
    >
      <ThreadView key={variant} variant={variant} foldOpen={foldOpen} onOpenFold={openFold} />
    </GmailShell>
  );
}
