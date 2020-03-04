import { formatDistance, fromUnixTime } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const formatDuration = (seconds: number) =>
    formatDistance(0, seconds * 1000, { includeSeconds: true });

export const getDateWithTimeZone = (date: number, timeZone?: string) => {
    const unixDate = fromUnixTime(date / 1000);
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return utcToZonedTime(unixDate, tz);
};
