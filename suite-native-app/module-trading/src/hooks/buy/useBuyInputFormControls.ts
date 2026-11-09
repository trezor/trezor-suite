import { useCallback } from 'react';

import { useWatch } from '@suite-native/forms';

import { useBuyFormContext } from './useBuyFormContext';
import {
    syncBuyAmountsAfterCryptoChange,
    syncBuyAmountsAfterFiatChange,
} from '../../utils/buy/buyAmountUtils';
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
                syncBuyAmountsAfterFiatChange({ getValues, setValue });
            } else {
                syncBuyAmountsAfterCryptoChange({ getValues, setValue });
            }
        },
        [getValues, name, setValue, updateFieldValue],
    );

    return {
        ...inputControls,
        onChangeText,
    };
};
