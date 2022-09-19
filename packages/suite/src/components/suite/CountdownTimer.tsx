import React, { useEffect, useState } from 'react';
import { useLocales } from '@suite-hooks/useLocales';
import { formatTimeLeft } from '@suite-utils/formatTimeLeft';

interface TimerProps {
    deadline: number;
    className?: string;
}

export const CountdownTimer = ({ deadline, className }: TimerProps) => {
    const locale = useLocales();

    const [timeLeftString, setTimeLeftString] = useState(
        formatTimeLeft(new Date(deadline), locale),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeftString(formatTimeLeft(new Date(deadline), locale));
        }, 100);

        return () => clearInterval(interval);
    }, [deadline, locale]);

    return <span className={className}>{timeLeftString}</span>;
};
