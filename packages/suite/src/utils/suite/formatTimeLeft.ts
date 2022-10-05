import formatDuration from 'date-fns/formatDuration';
import intervalToDuration from 'date-fns/intervalToDuration';
import isDate from 'date-fns/isDate';

export const formatTimeLeft = (
    deadline: Date,
    locale?: Locale,
    format: Array<keyof Duration> = ['hours', 'minutes'],
) => {
    try {
        if (!deadline || !isDate(deadline)) {
            return '';
        }

        const currentTime = Date.now();

        const isPastTheDeadline = deadline.getTime() < currentTime;

        if (isPastTheDeadline) {
            return formatDuration({ minutes: 0 }, { locale, format: ['minutes'], zero: true });
        }

        const duration = intervalToDuration({
            start: currentTime,
            end: deadline,
        });

        const formattedTimeLeft = formatDuration(duration, { locale, format });

        return formattedTimeLeft;
    } catch (error) {
        console.error(error);

        return '';
    }
};
