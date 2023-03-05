import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { prepareDateFormatter } from './prepareDateFormatter';
import { prepareTimeFormatter } from './prepareTimeFormatter';

export const prepareDateTimeFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number | null, string | null>(value => {
        if (!value) return null;
        const DateFormatter = prepareDateFormatter(config);
        const TimeFormatter = prepareTimeFormatter(config);

        return `${DateFormatter.format(value)}, ${TimeFormatter.format(value)}`;
    });
