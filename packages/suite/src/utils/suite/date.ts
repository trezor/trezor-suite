import { formatDistance } from 'date-fns';

export const formatDuration = (seconds: number) =>
    formatDistance(0, seconds * 1000, { includeSeconds: true });
