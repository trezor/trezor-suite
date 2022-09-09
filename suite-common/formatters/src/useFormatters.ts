import { useContext } from 'react';

import { FormatterProviderContext } from './FormatterProvider';
import { Formatters } from './types';

export const useFormatters = (): Formatters => {
    const formatters = useContext(FormatterProviderContext);
    return formatters;
};
