import { useEffect, useState, useCallback } from 'react';
import intervalToDuration from 'date-fns/intervalToDuration';

export const useCountdownTimer = (deadline: number) => {
    const getDuration = useCallback(
        (currentTimestamp = Date.now()) =>
            intervalToDuration({
                start: currentTimestamp,
                end: deadline,
            }),
        [deadline],
    );

    const [duration, setDuration] = useState(getDuration);
    const [isPastDeadline, setIsPastDeadline] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setIsPastDeadline(deadline <= now + 1000);

            setDuration(getDuration(now));
        }, 300);

        return () => clearInterval(interval);
    }, [deadline, getDuration]);

    return {
        duration,
        isPastDeadline,
    };
};
