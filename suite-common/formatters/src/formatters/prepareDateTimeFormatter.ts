import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { prepareDateFormatter } from './prepareDateFormatters';
import { prepareTimeFormatter } from './prepareTimeFormatter';

export const prepareDateTimeFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number | null, string | null>(value => {
        if (!value) return null;
        const DateFormatter = prepareDateFormatter(config);
        const TimeFormatter = prepareTimeFormatter(config);

        const formattedTime = TimeFormatter.format(value);
        const formattedDate = DateFormatter.format(value);

        return `${formattedDate}, ${formattedTime}`;
    });
