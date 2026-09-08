import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';
import { dateFormatterOptions } from './prepareDateFormatter';

export type DateTimeFormatterDataContext = {
    dateStyle?: 'short' | 'long';
};

export const prepareDateTimeFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number | null, string | null, DateTimeFormatterDataContext>(
        (value, { dateStyle }) => {
            if (!value) return null;

            const options: Intl.DateTimeFormatOptions = {
                ...dateFormatterOptions,
                month: dateStyle === 'long' ? 'long' : '2-digit',
                day: dateStyle === 'long' ? 'numeric' : '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: !config.is24HourFormat,
            };

            return new Intl.DateTimeFormat(undefined, options).format(value);
        },
        'DateTimeFormatter',
    );
