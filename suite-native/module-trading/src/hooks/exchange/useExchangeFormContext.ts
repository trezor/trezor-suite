import { useFormContext } from '@suite-native/forms';
import { ExchangeFormValues } from '@suite-native/trading-types';

export const useExchangeFormContext = () => useFormContext<ExchangeFormValues>();
