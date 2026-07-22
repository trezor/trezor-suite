import { useCallback } from 'react';

import { useWatch } from '@suite-native/forms';

import { useSellFormContext } from './useSellFormContext';
import { useInputFieldControls } from '../general/useInputFieldControls';

export const useSellInputFormControls = (name: 'fiatStringAmount' | 'cryptoStringAmount') => {
    const { control, getValues, setValue } = useSellFormContext();
    const value = useWatch({ control, name });
    const { onChangeText: updateFieldValue, ...inputControls } = useInputFieldControls(
        name,
        value,
        setValue,
    );

    const onChangeText = useCallback(
        (nextValue: string | undefined) => {
            updateFieldValue(nextValue);

            if (name === 'fiatStringAmount') {
                setValue('cryptoStringAmount', undefined, { shouldValidate: true });

                if (getValues('amountInCrypto')) {
                    setValue('amountInCrypto', false);
                }
            } else {
                setValue('fiatStringAmount', undefined, { shouldValidate: true });

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
