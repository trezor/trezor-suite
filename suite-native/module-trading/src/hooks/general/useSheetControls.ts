import { useCallback } from 'react';

import { useBottomSheetControls } from './useBottomSheetControls';
import { TradingBuyForm, TradingBuyFormValues } from '../../types';

export const useTradeSheetControls = <Key extends keyof TradingBuyFormValues>(
    { setValue, watch }: TradingBuyForm,
    key: Key,
) => {
    const bottomSheetControls = useBottomSheetControls();

    const selectedValue = watch(key);

    const setSelectedValue = useCallback(
        (value: typeof selectedValue) => setValue(key, value),
        [key, setValue],
    );

    return {
        selectedValue,
        setSelectedValue,
        ...bottomSheetControls,
    };
};
