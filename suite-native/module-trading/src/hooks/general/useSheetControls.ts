import { type Dispatch, useCallback } from 'react';

import { type FieldPathValue, type Path, type UseFormReturn, useWatch } from '@suite-native/forms';
import { useBottomSheetControls } from '@suite-native/trading-atoms';
import {
    type BuyFormValues,
    type ExchangeFormValues,
    type SellFormValues,
} from '@suite-native/trading-types';

type BottomSheetControls = ReturnType<typeof useBottomSheetControls>;
type FormUnion = BuyFormValues | ExchangeFormValues | SellFormValues;
// [typescript-performace]: Keep this explicit type to prevent TypeScript from expanding the
// inferred type in the emitted declaration.
type SheetControls<
    FormValues extends FormUnion,
    Key extends Path<FormValues>,
> = BottomSheetControls & {
    selectedValue: FieldPathValue<FormValues, Key>;
    setSelectedValue: Dispatch<FieldPathValue<FormValues, Key>>;
};

export const useSheetControls = <FormValues extends FormUnion, Key extends Path<FormValues>>(
    { setValue, control }: UseFormReturn<FormValues>,
    key: Key,
): SheetControls<FormValues, Key> => {
    const bottomSheetControls = useBottomSheetControls();

    const selectedValue = useWatch({ name: key, control });

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
