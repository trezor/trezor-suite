import { useEffect } from 'react';

import { type Control, type FieldValues, type Path, useWatch } from '@suite-native/forms';
import { tradingActions } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { useDebouncedValue } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

export const useFocusedValueWatch = <TFieldValues extends FieldValues>(
    control: Control<TFieldValues>,
) => {
    const { dispatch } = useServices(injectDispatch);

    const focusedValue = useWatch({ control, name: 'focusedValue' as Path<TFieldValues> });
    const isAmountInputActive = !!focusedValue;
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive);

    useEffect(() => {
        dispatch(tradingActions.setIsAmountInputActive(isAmountInputActiveDebounced));

        return () => {
            dispatch(tradingActions.setIsAmountInputActive(false));
        };
    }, [dispatch, isAmountInputActiveDebounced]);

    return isAmountInputActiveDebounced;
};
