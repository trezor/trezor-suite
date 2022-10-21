import React, { useEffect, useState } from 'react';
import { useLocales } from '@suite-hooks/useLocales';
import { formatTimeLeft } from '@suite-utils/formatTimeLeft';

interface TimerProps {
    deadline: number | string;
    format?: Array<keyof Duration>;
    className?: string;
}

export const CountdownTimer = ({
    deadline,
    format = ['hours', 'minutes'],
    className,
}: TimerProps) => {
    const locale = useLocales();

    const [timeLeftString, setTimeLeftString] = useState(
        formatTimeLeft(new Date(deadline), locale, format),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeftString(formatTimeLeft(new Date(deadline), locale, format));
        }, 100);

        return () => clearInterval(interval);
    }, [deadline, locale, format]);

    return <span className={className}>{timeLeftString}</span>;
};
