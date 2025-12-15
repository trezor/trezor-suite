import { useFormContext } from '@suite-native/forms';
import { type ExchangeFormValues } from '@suite-native/trading-types';

export const useExchangeFormContext = () => useFormContext<ExchangeFormValues>();
