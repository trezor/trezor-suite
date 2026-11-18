import { useFormContext } from '@suite-native/forms';
import {
    type ExchangeFormType,
    type ExchangeFormValidatedValues,
    type ExchangeFormValues,
} from '@suite-native/trading-types';

import { type TradingFormWithMetadata } from '../general/form/tradingFormTypes';

export const useExchangeFormContext = () =>
    useFormContext<
        ExchangeFormValues,
        object,
        ExchangeFormValidatedValues
    >() as TradingFormWithMetadata<ExchangeFormType>;
