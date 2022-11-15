import React, { useEffect, useState } from 'react';
import { useLocales } from '@suite-hooks/useLocales';
import { formatTimeLeft } from '@suite-utils/formatTimeLeft';
import { Translation } from './Translation';

interface TimerProps {
    deadline: number | string;
    format?: Array<keyof Duration>;
    isApproximate?: boolean;
    className?: string;
}

export const CountdownTimer = ({
    deadline,
    format = ['hours', 'minutes'],
    isApproximate,
    className,
}: TimerProps) => {
    const locale = useLocales();

    const [timeLeftString, setTimeLeftString] = useState(
        formatTimeLeft(new Date(deadline), locale, format),
    );
    const [isPastDeadline, setIsPastDeadline] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsPastDeadline(new Date(deadline).getTime() <= Date.now() + 1000);

            setTimeLeftString(formatTimeLeft(new Date(deadline), locale, format));
        }, 100);

        return () => clearInterval(interval);
    }, [deadline, locale, format]);

    return (
        <span className={className}>
            {!isPastDeadline && isApproximate && '~'}

            {isPastDeadline && isApproximate ? (
                <Translation id="TR_TIMER_PAST_DEADLINE" />
            ) : (
                timeLeftString
            )}
        </span>
    );
};
