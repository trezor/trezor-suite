import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const dateFormatterOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
};

export const prepareDateFormatter = (_config: FormatterConfig) =>
    makeFormatter<Date | number, string>(
        value => new Intl.DateTimeFormat(undefined, dateFormatterOptions).format(value),
        'DateFormatter',
    );
