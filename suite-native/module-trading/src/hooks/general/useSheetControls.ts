import { type Dispatch, useCallback } from 'react';

import type { FieldPathValue, Path, UseFormReturn } from '@suite-native/forms';
import { useBottomSheetControls } from '@suite-native/trading-atoms';
import {
    type BuyFormValues,
    type ExchangeFormValues,
    type SellFormValues,
} from '@suite-native/trading-types';

type BottomSheetControls = ReturnType<typeof useBottomSheetControls>;
type FormUnion = BuyFormValues | ExchangeFormValues | SellFormValues;
// explicit return type declaration, because typescript reaches its limits when trying to infer type
type SheetControls<
    FormValues extends FormUnion,
    Key extends Path<FormValues>,
> = BottomSheetControls & {
    selectedValue: FieldPathValue<FormValues, Key>;
    setSelectedValue: Dispatch<FieldPathValue<FormValues, Key>>;
};

export const useSheetControls = <FormValues extends FormUnion, Key extends Path<FormValues>>(
    { setValue, watch }: UseFormReturn<FormValues>,
    key: Key,
): SheetControls<FormValues, Key> => {
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
