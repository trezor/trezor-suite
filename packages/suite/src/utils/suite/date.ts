import {
    formatDistance,
    isBefore,
    addMonths,
    subWeeks,
    addDays,
    fromUnixTime,
    getUnixTime,
    startOfDay,
    startOfMonth,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { GraphTicksInterval } from '@wallet-types/fiatRates';

export const formatDuration = (seconds: number) =>
    formatDistance(0, seconds * 1000, { includeSeconds: true });

export const getLocalTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const getDateWithTimeZone = (date: number, timeZone?: string) => {
    try {
        const unixDate = fromUnixTime(date / 1000);
        const tz = timeZone || getLocalTimeZone();
        return utcToZonedTime(unixDate, tz);
    } catch (err) {
        console.error(err);
        return null;
    }
};

export const getTicksBetweenTimestamps = (
    from: Date,
    to: Date,
    interval: 'quarter' | 'month' | 'day' | '2-day',
) => {
    const ticks = [];
    let fromDate = from;
    const toDate = to;

    if (isBefore(toDate, fromDate)) {
        return [];
    }

    // set hh:mm:ss to 00:00:00
    fromDate = startOfDay(fromDate);
    ticks.push(fromDate);

    while (isBefore(fromDate, toDate)) {
        if (interval === 'quarter') {
            fromDate = startOfMonth(fromDate);
            fromDate = addMonths(fromDate, 3);
            ticks.push(fromDate);
        }
        if (interval === 'month') {
            // set date to 1 in case of monthly timestamps
            fromDate = startOfMonth(fromDate);
            fromDate = addMonths(fromDate, 1);
            ticks.push(fromDate);
        }
        if (interval === 'day') {
            fromDate = addDays(fromDate, 1);
            ticks.push(fromDate);
        }
        if (interval === '2-day') {
            fromDate = addDays(fromDate, 2);
            ticks.push(fromDate);
        }
    }
    // months.push(toDate);
    return ticks;
};

export const calcTicks = (weeks: number, options?: { skipDays?: boolean }) => {
    const startDate = subWeeks(new Date(), weeks);
    const endDate = new Date();
    let interval: GraphTicksInterval = 'month';

    if (weeks < 52) {
        interval = 'day';
    }
    if (weeks === 4) {
        interval = options?.skipDays ? '2-day' : 'day';
    }
    if (weeks === 1) {
        interval = 'day';
    }

    return getTicksBetweenTimestamps(startDate, endDate, interval);
};

export const calcTicksFromData = (data: { time: number }[]) => {
    if (!data || data.length < 1) return [];
    const startDate = data.reduce((min, current) => {
        return current.time < min ? current.time : min;
    }, data[0].time);
    const endDate = data.reduce((max, current) => {
        return current.time > max ? current.time : max;
    }, data[0].time);

    return getTicksBetweenTimestamps(fromUnixTime(startDate), fromUnixTime(endDate), 'quarter');
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
    const timestamp = getUnixTime(new Date());
    return timestamp - 180; // current time - 3 mins
};

/**
 * Sets hh:mm:ss to 00:00:00 in local timezone (UTC time may be different).
 * If `resetDay` is true  sets date to the first of the month
 * Returns unix timestamp
 *
 * @param {number} ts
 * @param {number} weeks
 * @returns
 */
export const resetTime = (ts: number, resetDay?: boolean) => {
    let sanitizedTimestamp = fromUnixTime(ts);

    sanitizedTimestamp = startOfDay(sanitizedTimestamp);
    if (resetDay) {
        sanitizedTimestamp = startOfMonth(sanitizedTimestamp);
    }
    return getUnixTime(sanitizedTimestamp);
};

/**
 * Sets hh:mm:ss to 00:00:00 in UTC.
 * If `resetDay` is true  sets date to the first of the month
 * Returns unix timestamp
 *
 * @param {number} ts
 * @param {number} weeks
 * @returns
 */
export const resetUTCTime = (ts: number, resetDay?: boolean) => {
    let sanitizedTimestamp = fromUnixTime(ts);
    sanitizedTimestamp = fromUnixTime(sanitizedTimestamp.setUTCHours(0) / 1000);
    sanitizedTimestamp = fromUnixTime(sanitizedTimestamp.setUTCMinutes(0) / 1000);
    sanitizedTimestamp = fromUnixTime(sanitizedTimestamp.setUTCSeconds(0) / 1000);

    if (resetDay) {
        sanitizedTimestamp = fromUnixTime(sanitizedTimestamp.setUTCDate(1) / 1000);
    }
    const sanitizedUnixTimestamp = getUnixTime(sanitizedTimestamp);
    return sanitizedUnixTimestamp;
};
