import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { tradingActions } from '@suite-native/trading-state';
import { useDebouncedValue } from '@trezor/react-utils';

export const useFocusedValueWatch = <T extends string | undefined>(
    watch: (field: 'focusedValue') => T,
) => {
    const dispatch = useDispatch();

    const isAmountInputActive = !!watch('focusedValue');
    const isAmountInputActiveDebounced = useDebouncedValue(isAmountInputActive);

    useEffect(() => {
        dispatch(tradingActions.setIsAmountInputActive(isAmountInputActiveDebounced));

        return () => {
            dispatch(tradingActions.setIsAmountInputActive(false));
        };
    }, [dispatch, isAmountInputActiveDebounced]);

    return isAmountInputActiveDebounced;
};
