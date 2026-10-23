import { useEffect, useState } from 'react';

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

type UseIsPastDeadlineOptions = {
    pastDeadlineLeadMs?: number;
};

const isPast = (deadline: number | undefined, pastDeadlineLeadMs: number) =>
    deadline !== undefined && deadline <= Date.now() + pastDeadlineLeadMs;

export const useIsPastDeadline = (
    deadline: number | undefined,
    { pastDeadlineLeadMs = 1000 }: UseIsPastDeadlineOptions = {},
): boolean => {
    const [isPastDeadline, setIsPastDeadline] = useState(() =>
        isPast(deadline, pastDeadlineLeadMs),
    );

    useEffect(() => {
        setIsPastDeadline(isPast(deadline, pastDeadlineLeadMs));

        if (deadline === undefined) return undefined;

        let timeout: ReturnType<typeof setTimeout>;
        const schedule = () => {
            timeout = setTimeout(
                () => {
                    if (isPast(deadline, pastDeadlineLeadMs)) {
                        setIsPastDeadline(true);
                    } else {
                        schedule();
                    }
                },
                Math.min(Math.max(deadline - pastDeadlineLeadMs - Date.now(), 0), MAX_TIMEOUT_MS),
            );
        };
        schedule();

        return () => clearTimeout(timeout);
    }, [deadline, pastDeadlineLeadMs]);

    return isPastDeadline;
};
