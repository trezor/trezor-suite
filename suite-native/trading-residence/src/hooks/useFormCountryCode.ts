import { useFormContext, useWatch } from '@suite-native/forms';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export const useFormCountryCode = () => {
    const { control } = useFormContext<TradingLocationFormValues>();
    const country = useWatch({ control, name: 'country' });

    return country.value;
};
