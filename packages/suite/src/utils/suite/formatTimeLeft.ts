import formatDuration from 'date-fns/formatDuration';
import intervalToDuration from 'date-fns/intervalToDuration';

export const formatTimeLeft = (
    deadline: Date,
    locale?: Locale,
    format: Array<keyof Duration> = ['hours', 'minutes'],
) => {
    const duration = intervalToDuration({
        start: Date.now(),
        end: deadline,
    });

    const formattedTimeLeft = formatDuration(duration, { locale, format });

    return formattedTimeLeft;
};
