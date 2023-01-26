import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const prepareTimeFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number, string>(value => {
        const { intl } = config;
        return intl.formatTime(value);
    });
