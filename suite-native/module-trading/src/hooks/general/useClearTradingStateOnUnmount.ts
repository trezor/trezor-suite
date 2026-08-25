import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { clearTradingStateThunk } from '../../thunks';

export const useClearTradingStateOnUnmount = () => {
    const dispatch = useDispatch();

    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );
};
