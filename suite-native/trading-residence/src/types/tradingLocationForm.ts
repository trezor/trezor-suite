import { type TradingCountryOption } from '@suite-common/trading';
import type { UseFormReturn } from '@suite-native/forms';

export type TradingLocationFormValues = {
    country: TradingCountryOption;
};

export type TradingLocationFormType = UseFormReturn<TradingLocationFormValues>;
