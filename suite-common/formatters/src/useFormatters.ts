import { useContext } from 'react';

import { FormatterProviderContext, type Formatters } from './FormatterProvider';

export const useFormatters = (): Formatters => useContext(FormatterProviderContext);
