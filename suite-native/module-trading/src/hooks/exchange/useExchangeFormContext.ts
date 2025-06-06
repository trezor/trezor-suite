import { useFormContext } from '@suite-native/forms';

import { ExchangeFormValues } from '../../types/exchange';

export const useExchangeFormContext = () => useFormContext<ExchangeFormValues>();
