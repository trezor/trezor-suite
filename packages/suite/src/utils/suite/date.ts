import { formatDistance } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const formatDuration = (seconds: number) =>
    formatDistance(0, seconds * 1000, { includeSeconds: true });

export const getDateWithTimeZone = (date: number | string, timeZone?: string): Date => {
    const isoDate = new Date(date).toISOString();
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    return utcToZonedTime(isoDate, tz);
};
