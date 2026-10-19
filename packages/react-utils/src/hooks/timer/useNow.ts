import { useEffect, useState } from 'react';

export const useNow = (intervalMs: number): number => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        setNow(Date.now());

        const interval = setInterval(() => setNow(Date.now()), intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    return now;
};
