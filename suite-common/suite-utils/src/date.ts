import { type Locale } from 'date-fns';
import {
    differenceInCalendarMonths,
    differenceInMonths,
    eachDayOfInterval,
    eachMonthOfInterval,
    eachQuarterOfInterval,
    formatDistance,
    formatDistanceStrict,
    fromUnixTime,
    getUnixTime,
    startOfDay,
    startOfMonth,
} from 'date-fns';

export const formatDuration = (seconds: number) =>
    formatDistance(0, seconds * 1000, { includeSeconds: true });

export const formatDurationStrict = (seconds: number, locale?: Locale) =>
    formatDistanceStrict(0, seconds * 1000, { locale });

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
    const startDate = data.reduce(
        (min, current) => (current.time < min ? current.time : min),
        data[0].time,
    );
    const endDate = data.reduce(
        (max, current) => (current.time > max ? current.time : max),
        data[0].time,
    );

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
