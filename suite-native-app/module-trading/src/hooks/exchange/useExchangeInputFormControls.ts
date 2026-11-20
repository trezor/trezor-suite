import { useCallback } from 'react';

import { useWatch } from '@suite-native/forms';

import { useExchangeFormContext } from './useExchangeFormContext';
import { useInputFieldControls } from '../general/useInputFieldControls';

export const useExchangeInputFormControls = () => {
    const { control, setValue } = useExchangeFormContext();
    const value = useWatch({ control, name: 'sendCryptoAmount' });
    const { onChangeText: updateFieldValue, ...inputControls } = useInputFieldControls(
        'sendCryptoAmount',
        value,
        setValue,
    );

    const onChangeText = useCallback(
        (nextValue: string | undefined) => {
            updateFieldValue(nextValue);
            setValue('sendBaseCurrencyAmount', undefined);
        },
        [setValue, updateFieldValue],
    );

    return {
        ...inputControls,
        onChangeText,
    };
};
