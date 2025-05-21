import { useCallback } from 'react';

import type { FieldPath, FieldValues, UseFormReturn } from '@suite-native/forms';

import { useBottomSheetControls } from './useBottomSheetControls';

export type SheetControls<TFieldValues extends FieldValues, Key extends FieldPath<TFieldValues>> = {
    selectedValue: TFieldValues[Key];
    setSelectedValue: (value: TFieldValues[Key]) => void;
} & ReturnType<typeof useBottomSheetControls>;

export const useSheetControls = <
    TFieldValues extends FieldValues,
    Key extends FieldPath<TFieldValues>,
>(
    { setValue, watch }: UseFormReturn<TFieldValues>,
    key: Key,
): SheetControls<TFieldValues, Key> => {
    const bottomSheetControls = useBottomSheetControls();

    const selectedValue = watch(key as FieldPath<TFieldValues>);

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
