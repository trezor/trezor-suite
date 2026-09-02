import { useEffect } from 'react';

import { useDispatch } from '@suite-common/redux-utils';

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
