import { useCallback } from 'react';

import { useWatch } from '@suite-native/forms';

import { useBuyFormContext } from './useBuyFormContext';
import { useInputFieldControls } from '../general/useInputFieldControls';

export const useBuyInputFormControls = (name: 'fiatValue' | 'cryptoValue') => {
    const { control, getValues, setValue } = useBuyFormContext();
    const value = useWatch({ control, name });
    const { onChangeText: updateFieldValue, ...inputControls } = useInputFieldControls(
        name,
        value,
        setValue,
    );

    const onChangeText = useCallback(
        (nextValue: string | undefined) => {
            updateFieldValue(nextValue);

            if (name === 'fiatValue') {
                setValue('cryptoValue', undefined, { shouldValidate: true });

                if (getValues('amountInCrypto')) {
                    setValue('amountInCrypto', false);
                }
            } else {
                setValue('fiatValue', undefined, { shouldValidate: true });

                if (!getValues('amountInCrypto')) {
                    setValue('amountInCrypto', true);
                }
            }
        },
        [getValues, name, setValue, updateFieldValue],
    );

    return {
        ...inputControls,
        onChangeText,
    };
};
