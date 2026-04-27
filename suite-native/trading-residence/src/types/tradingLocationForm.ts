import {
    type TradingCountryOption,
    type TradingCountrySubdivisionOption,
} from '@suite-common/trading';
import type { UseFormReturn } from '@suite-native/forms';

export type TradingLocationFormValues = {
    country: TradingCountryOption;
    countrySubdivision?: TradingCountrySubdivisionOption;
};

export type TradingLocationFormType = UseFormReturn<TradingLocationFormValues>;
