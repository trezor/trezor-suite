import { useCallback } from 'react';

import { TradingBuyForm, TradingBuyFormValues } from '../types';
import { useBottomSheetControls } from './useBottomSheetControls';

export const useTradeSheetControls = <Key extends keyof TradingBuyFormValues>(
    form: TradingBuyForm,
    key: Key,
) => {
    const bottomSheetControls = useBottomSheetControls();

    const selectedValue = form.watch(key);
    const setSelectedValue = useCallback(
        (value: typeof selectedValue) => form.setValue(key, value),
        [form, key],
    );

    return {
        selectedValue,
        setSelectedValue,
        ...bottomSheetControls,
    };
};
