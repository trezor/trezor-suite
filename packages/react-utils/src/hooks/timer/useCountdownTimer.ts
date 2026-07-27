import { useEffect, useState } from 'react';

import { intervalToDuration } from 'date-fns';

type UseCountdownTimerOptions = {
    pastDeadlineLeadMs?: number;
    isEnabled?: boolean;
};

export const useCountdownTimer = (
    deadline: number,
    { pastDeadlineLeadMs = 1000, isEnabled = true }: UseCountdownTimerOptions = {},
) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isEnabled) return undefined;

        setNow(Date.now());

        const interval = setInterval(() => setNow(Date.now()), 300);

        return () => clearInterval(interval);
    }, [isEnabled, deadline]);

    const duration = intervalToDuration({ start: now, end: deadline });
    const isPastDeadline = deadline <= now + pastDeadlineLeadMs;

    return {
        duration,
        isPastDeadline,
    };
};
