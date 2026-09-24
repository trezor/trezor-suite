import { useFormContext } from '@suite-native/forms';
import { type SellFormType, type SellFormValues } from '@suite-native/trading-types';

import { type TradingFormWithMetadata } from '../general/form/tradingFormTypes';

export const useSellFormContext = () =>
    useFormContext<SellFormValues>() as TradingFormWithMetadata<SellFormType>;
