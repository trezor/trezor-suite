import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { type Control, type FieldValues, type Path, useWatch } from '@suite-native/forms';
import { tradingActions } from '@suite-native/trading-state';
import { useDebouncedValue } from '@trezor/react-utils';

export const useFocusedValueWatch = <TFieldValues extends FieldValues>(
    control: Control<TFieldValues>,
) => {
    const dispatch = useDispatch();

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
