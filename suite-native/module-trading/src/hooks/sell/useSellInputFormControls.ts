import { useCallback } from 'react';

import { useWatch } from '@suite-native/forms';

import { useSellFormContext } from './useSellFormContext';
import {
    syncSellAmountsAfterCryptoChange,
    syncSellAmountsAfterFiatChange,
} from '../../utils/sell/sellAmountUtils';
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
                syncSellAmountsAfterFiatChange({ getValues, setValue });
            } else {
                syncSellAmountsAfterCryptoChange({ getValues, setValue });
            }
        },
        [getValues, name, setValue, updateFieldValue],
    );

    return {
        ...inputControls,
        onChangeText,
    };
};
