import { FormattedRelativeTime } from 'react-intl';

import { getRelativeTimeUnit } from './getRelativeTimeUnit';

const getRoundedSecondsFromNow = (timestamp: number) =>
    Math.trunc((timestamp - Date.now()) / 60_000) * 60;

const getLongUnitFromNow = (timestamp: number) =>
    getRelativeTimeUnit((timestamp - Date.now()) / 1000);

type RelativeTimeProps = {
    timestamp: number;
    // Months and years for times long ago, but without live updates, which react-intl only
    // supports in units up to hours.
    hasLongUnits?: boolean;
};

export const RelativeTime = ({ timestamp, hasLongUnits }: RelativeTimeProps) =>
    hasLongUnits ? (
        <FormattedRelativeTime {...getLongUnitFromNow(timestamp)} numeric="auto" />
    ) : (
        <FormattedRelativeTime
            value={getRoundedSecondsFromNow(timestamp)}
            numeric="auto"
            updateIntervalInSeconds={10}
        />
    );
