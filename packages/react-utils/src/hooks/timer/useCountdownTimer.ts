import { useCallback, useEffect, useState } from 'react';

import { intervalToDuration } from 'date-fns';

type UseCountdownTimerOptions = {
    pastDeadlineLeadMs?: number;
    isEnabled?: boolean;
};

export const useCountdownTimer = (
    deadline: number,
    { pastDeadlineLeadMs = 1000, isEnabled = true }: UseCountdownTimerOptions = {},
) => {
    const getDuration = useCallback(
        (currentTimestamp = Date.now()) =>
            intervalToDuration({
                start: currentTimestamp,
                end: deadline,
            }),
        [deadline],
    );

    const [duration, setDuration] = useState(getDuration);
    const [isPastDeadline, setIsPastDeadline] = useState(
        () => deadline <= Date.now() + pastDeadlineLeadMs,
    );

    useEffect(() => {
        if (!isEnabled) return;

        const interval = setInterval(() => {
            const now = Date.now();
            setIsPastDeadline(deadline <= now + pastDeadlineLeadMs);

            setDuration(getDuration(now));
        }, 300);

        return () => clearInterval(interval);
    }, [isEnabled, deadline, getDuration, pastDeadlineLeadMs]);

    return {
        duration,
        isPastDeadline,
    };
};
