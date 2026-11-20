import { useEffect } from 'react';

import { type Control, type FieldValues, type Path, useWatch } from '@suite-native/forms';
import { tradingActions } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { useDebouncedValue } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

const AMOUNT_INPUT_ACTIVE_DEBOUNCE_DELAY = 50;

export const useFocusedValueWatch = <
    TFieldValues extends FieldValues,
    TTransformedValues = TFieldValues,
>(
    control: Control<TFieldValues, object, TTransformedValues>,
) => {
    const { dispatch } = useServices(injectDispatch);

    const focusedValue = useWatch({ control, name: 'focusedValue' as Path<TFieldValues> });
    const isAmountInputActive = !!focusedValue;
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive, {
        delay: AMOUNT_INPUT_ACTIVE_DEBOUNCE_DELAY,
    });

    useEffect(() => {
        dispatch(tradingActions.setIsAmountInputActive(isAmountInputActiveDebounced));

        return () => {
            dispatch(tradingActions.setIsAmountInputActive(false));
        };
    }, [dispatch, isAmountInputActiveDebounced]);

    return isAmountInputActiveDebounced;
};
