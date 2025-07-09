import { useContext } from 'react';

import { FormatterProviderContext, Formatters } from './FormatterProvider';

export const useFormatters = (): Formatters => useContext(FormatterProviderContext);
