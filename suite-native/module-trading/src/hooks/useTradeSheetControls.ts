import { useCallback } from 'react';

import { TradingBuyForm, TradingBuyFormValues } from '../types';
import { useBottomSheetControls } from './useBottomSheetControls';

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
