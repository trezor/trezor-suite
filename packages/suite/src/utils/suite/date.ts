import { formatDistance, isBefore, addMonths, subWeeks, addDays, fromUnixTime } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const formatDuration = (seconds: number) =>
    formatDistance(0, seconds * 1000, { includeSeconds: true });

export const getDateWithTimeZone = (date: number, timeZone?: string) => {
    try {
        const unixDate = fromUnixTime(date / 1000);
        const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        return utcToZonedTime(unixDate, tz);
    } catch (err) {
        console.error(err);
        return null;
    }
};

export const getTicksBetweenTimestamps = (from: Date, to: Date, interval: 'month' | 'day') => {
    let fromDate = from;
    const toDate = to;

    if (isBefore(toDate, fromDate)) {
        return [];
    }

    const months = [];
    while (isBefore(fromDate, toDate)) {
        months.push(fromDate);
        if (interval === 'month') {
            fromDate = addMonths(fromDate, 1);
        }
        if (interval === 'day') {
            fromDate = addDays(fromDate, 1);
        }
    }
    months.push(fromDate);
    return months;
};

export const calcTicks = (weeks: number) => {
    const startDate = subWeeks(new Date(), weeks);
    const endDate = new Date();
    return getTicksBetweenTimestamps(startDate, endDate, weeks === 52 ? 'month' : 'day');
};
