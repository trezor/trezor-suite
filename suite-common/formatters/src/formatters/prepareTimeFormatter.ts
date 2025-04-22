import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const TIME_FORMAT = {
    HOURS_24: 'HH:mm',
    HOURS_12: 'hh:mm a',
};

export const prepareTimeFormatter = ({ is24HourFormat }: FormatterConfig) =>
    makeFormatter<Date | number, string>(value => {
        const timeFormat = is24HourFormat ? TIME_FORMAT.HOURS_24 : TIME_FORMAT.HOURS_12;

        return format(value, timeFormat, { locale: enUS });
    }, 'TimeFormatter');
