import { useCallback } from 'react';

import type { Path, UseFormReturn } from '@suite-native/forms';

import { useBottomSheetControls } from './useBottomSheetControls';
import { BuyFormValues } from '../../types/buy';
import { ExchangeFormValues } from '../../types/exchange';

export const useSheetControls = <
    FormValues extends BuyFormValues | ExchangeFormValues,
    Key extends Path<FormValues>,
>(
    { setValue, watch }: UseFormReturn<FormValues>,
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
