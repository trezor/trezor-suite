import {
    formatDistance,
    formatDistanceStrict,
    differenceInMonths,
    fromUnixTime,
    getUnixTime,
    startOfDay,
    startOfMonth,
    differenceInCalendarMonths,
    eachQuarterOfInterval,
    eachMonthOfInterval,
    eachDayOfInterval,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const formatDuration = (seconds: number) =>
    formatDistance(0, seconds * 1000, { includeSeconds: true });

export const formatDurationStrict = (seconds: number) => formatDistanceStrict(0, seconds * 1000);

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
        return undefined;
    }
};

export const calcTicks = (startDate: Date, endDate: Date) => {
    let timestamps = [];
    if (differenceInMonths(endDate, startDate) <= 1) {
        timestamps = eachDayOfInterval({ start: startDate, end: endDate });
    } else {
        timestamps = eachMonthOfInterval({ start: startDate, end: endDate });
    }

    return timestamps;
};

export const calcTicksFromData = (data: { time: number }[]) => {
    if (!data || data.length < 1) return [];
    const startDate = data.reduce((min, current) => {
        return current.time < min ? current.time : min;
    }, data[0].time);
    const endDate = data.reduce((max, current) => {
        return current.time > max ? current.time : max;
    }, data[0].time);

    const startUnix = fromUnixTime(startDate);
    const endUnix = fromUnixTime(endDate);

    // TODO: input data are processed by aggregateBalanceHistory which aggregates the data to monthly bins, so we can't get sub month interval here
    // let interval = '3-months';
    // const daysDiff = differenceInCalendarDays(endUnix, startUnix);
    // if (daysDiff <= 14) {
    //     interval = 'day';
    // } else if (daysDiff <= 30) {
    //     interval = '2-day';
    // } else if (daysDiff <= 365 * 2) {
    //     // less than 24 months between first and last timestamps => we can fit monthly ticks just fine
    //     interval = 'month';
    // }

    // less than 16 months between first and last timestamps => we can fit monthly ticks just fine
    const interval = differenceInCalendarMonths(endUnix, startUnix) <= 16 ? 'month' : '3-months';

    if (interval === 'month') {
        // 1 month interval
        const timestamps = eachMonthOfInterval({ start: startUnix, end: endUnix });
        return timestamps;
    }

    // 3 months interval
    const timestamps = eachQuarterOfInterval({ start: startUnix, end: endUnix });

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
 * @param {boolean} resetDay
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
 * @param {boolean} [resetDay]
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
