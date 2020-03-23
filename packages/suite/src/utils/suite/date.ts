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

export const getTicksBetweenTimestamps = (
    from: Date,
    to: Date,
    interval: 'month' | 'day' | '2-day',
) => {
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
        if (interval === '2-day') {
            fromDate = addDays(fromDate, 2);
        }
    }
    months.push(fromDate);
    return months;
};

export const calcTicks = (weeks: number) => {
    const startDate = subWeeks(new Date(), weeks);
    const endDate = new Date();
    let interval: 'month' | 'day' | '2-day' = 'month';
    if (weeks < 52) {
        interval = 'day';
    }
    if (weeks === 4) {
        interval = '2-day';
    }
    if (weeks === 1) {
        interval = 'day';
    }

    return getTicksBetweenTimestamps(startDate, endDate, interval);
};
/**
 * Returns array of timestamps between `from` and `to` split by `interval`
 *
 * @param {number} from timestamp
 * @param {number} to timestamp
 * @param {number} interval interval in the same units as timestamps
 * @param {boolean} include include trailing and leading timestamps
 * @returns
 */
export const splitTimestampsByInterval = (
    from: number,
    to: number,
    interval: number,
    include?: boolean,
) => {
    const timestamps: number[] = [];

    if (to < from) return [];

    let timestamp = from;
    if (include) timestamps.push(timestamp);
    while (timestamp + interval < to) {
        timestamp += interval;
        timestamps.push(timestamp);
    }
    if (include) timestamps.push(to);
    return timestamps;
};
/**
 * Returns Blockbook-safe current unix timestamp (current time - 3 mins).
 * Little workaround for Blockbook as it doesn't return rates data for too recent timestamps.
 *
 * @returns
 */
export const getBlockbookSafeTime = () => {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    return timestamp - 180; // current time - 3 mins
};
