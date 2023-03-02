import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const prepareTimeFormatter = ({ is24HourFormat }: FormatterConfig) =>
    makeFormatter<Date | number, string>(value => {
        const timeFormat = is24HourFormat ? 'HH:mm' : 'hh:mm a';
        return format(value, timeFormat, { locale: enUS });
    });
