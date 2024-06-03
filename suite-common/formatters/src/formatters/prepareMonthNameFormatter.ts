import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { makeFormatter } from '../makeFormatter';

export const MonthNameFormatter = makeFormatter<Date, string>(
    value =>
        // use date-fns because toLocaleString is slow in RN
        format(value, 'MMMM', { locale: enUS }),
    'MonthNameFormatter',
);
