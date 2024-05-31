import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const DATE_FORMAT = 'dd/MM/yyyy';

export const prepareDateFormatter = (_config: FormatterConfig) =>
    makeFormatter<Date | number, string>(
        value => format(value, DATE_FORMAT, { locale: enUS }),
        'DateFormatter',
    );
