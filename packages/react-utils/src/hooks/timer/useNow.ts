import { useEffect, useState } from 'react';

// A null interval reads the time once, so a caller that ticks in some states only keeps one hook.
export const useNow = (intervalMs: number | null): number => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        setNow(Date.now());

        if (intervalMs === null) return undefined;

        const interval = setInterval(() => setNow(Date.now()), intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    return now;
};
