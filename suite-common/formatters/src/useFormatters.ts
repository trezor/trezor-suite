import { useContext } from 'react';

import type { Formatters } from './FormatterProvider';
import { FormatterProviderContext } from './FormatterProvider';

export const useFormatters = (): Formatters => useContext(FormatterProviderContext);
