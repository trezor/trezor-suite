import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const prepareDateFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number, string>(value => {
        const { intl } = config;
        return intl.formatDate(value);
    });
