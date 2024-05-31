import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';
import { DATE_FORMAT } from './prepareDateFormatter';
import { TIME_FORMAT } from './prepareTimeFormatter';

export const prepareDateTimeFormatter = (config: FormatterConfig) =>
    makeFormatter<Date | number | null, string | null>(value => {
        if (!value) return null;
        const timeFormat = config.is24HourFormat ? TIME_FORMAT.HOURS_24 : TIME_FORMAT.HOURS_12;

        // it's more performant to use just one format than to combine date+time formatter
        return format(value, `${DATE_FORMAT}, ${timeFormat}`, { locale: enUS });
    }, 'DateTimeFormatter');
