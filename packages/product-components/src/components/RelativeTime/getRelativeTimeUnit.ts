const RELATIVE_TIME_UNITS = [
    { unit: 'year', seconds: 365 * 24 * 60 * 60 },
    { unit: 'month', seconds: 30 * 24 * 60 * 60 },
    { unit: 'day', seconds: 24 * 60 * 60 },
    { unit: 'hour', seconds: 60 * 60 },
    { unit: 'minute', seconds: 60 },
] as const;

// react-intl picks the unit itself only up to days, which shows a long-ago time as "891 days ago".
export const getRelativeTimeUnit = (secondsFromNow: number) => {
    const absoluteSeconds = Math.abs(secondsFromNow);
    const { unit, seconds } =
        RELATIVE_TIME_UNITS.find(candidate => absoluteSeconds >= candidate.seconds) ??
        ({ unit: 'second', seconds: 1 } as const);

    return { value: Math.trunc(secondsFromNow / seconds), unit };
};
