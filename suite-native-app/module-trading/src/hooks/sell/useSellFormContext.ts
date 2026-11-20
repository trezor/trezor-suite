import { useFormContext } from '@suite-native/forms';
import {
    type SellFormType,
    type SellFormValidatedValues,
    type SellFormValues,
} from '@suite-native/trading-types';

import { type TradingFormWithMetadata } from '../general/form/tradingFormTypes';

export const useSellFormContext = () =>
    useFormContext<
        SellFormValues,
        object,
        SellFormValidatedValues
    >() as TradingFormWithMetadata<SellFormType>;
