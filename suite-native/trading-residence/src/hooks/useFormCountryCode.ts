import { useFormContext } from '@suite-native/forms';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export const useFormCountryCode = () => {
    const { watch } = useFormContext<TradingLocationFormValues>();

    return watch('country').value;
};
