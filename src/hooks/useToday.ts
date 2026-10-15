import { useEffect, useState } from 'react';

import { nextResetAt } from '../game/schedule';

const isSameDay = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

/**
 * Today's date, re-checked when the tab is refocused and when the clock passes midnight.
 *
 * The daily puzzle is derived from the date, so a tab left open across midnight
 * has to notice the change: without this it would keep yesterday's word until it
 * was reloaded.
 */
export const useToday = (): Date => {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    // Keeping the previous instance when the day has not changed means the
    // effects that depend on it do not re-run every time the tab is refocused.
    const refresh = (): void => {
      const now = new Date();
      setToday((previous) => (isSameDay(previous, now) ? previous : now));
    };

    let timeout = 0;
    const scheduleMidnight = (): void => {
      const from = new Date();
      timeout = window.setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, nextResetAt(from).getTime() - from.getTime());
    };

    scheduleMidnight();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
};
