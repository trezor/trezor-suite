import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { dateFormatterOptions } from './prepareDateFormatter';

export const prepareDateTimeFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number | null, string | null>(value => {
        if (!value) return null;

        const options: Intl.DateTimeFormatOptions = {
            ...dateFormatterOptions,
            hour: '2-digit',
            minute: '2-digit',
            hour12: !config.is24HourFormat,
        };

        return new Intl.DateTimeFormat(undefined, options).format(value);
    }, 'DateTimeFormatter');
