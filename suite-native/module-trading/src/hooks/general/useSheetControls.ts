import { useCallback } from 'react';

import { useBottomSheetControls } from './useBottomSheetControls';
import { BuyFormType, BuyFormValues } from '../../types/buy';

export const useSheetControls = <Key extends keyof BuyFormValues>(
    { setValue, watch }: BuyFormType,
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
