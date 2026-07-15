import { FormattedRelativeTime } from 'react-intl';

const getRoundedSecondsFromNow = (timestamp: number) =>
    Math.trunc((timestamp - Date.now()) / 60_000) * 60;

type RelativeTimeProps = {
    timestamp: number;
};

export const RelativeTime = ({ timestamp }: RelativeTimeProps) => (
    <FormattedRelativeTime
        value={getRoundedSecondsFromNow(timestamp)}
        numeric="auto"
        updateIntervalInSeconds={10}
    />
);
