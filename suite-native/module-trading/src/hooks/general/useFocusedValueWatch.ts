import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useDebouncedValue } from '@trezor/react-utils';

import { tradingActions } from '../../tradingSlice';

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
