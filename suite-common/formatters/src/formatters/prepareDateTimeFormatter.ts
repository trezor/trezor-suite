import { A, pipe } from '@mobily/ts-belt';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { prepareDateFormatter } from './prepareDateFormatter';
import { prepareTimeFormatter } from './prepareTimeFormatter';

export const prepareDateTimeFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number | null, string | null>(value => {
        if (!value) return null;
        const DateFormatter = prepareDateFormatter(config);
        const TimeFormatter = prepareTimeFormatter(config);

        return pipe([TimeFormatter.format(value), DateFormatter.format(value)], A.join(' '));
    });
