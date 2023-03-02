import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export const prepareDateFormatter = (_config: FormatterConfig) =>
    makeFormatter<Date | number, string>(value => format(value, 'dd/MM/yyyy', { locale: enUS }));
