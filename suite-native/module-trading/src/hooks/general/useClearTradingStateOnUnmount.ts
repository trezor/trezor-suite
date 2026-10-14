import { useEffect } from 'react';

import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { clearTradingStateThunk } from '../../thunks';

export const useClearTradingStateOnUnmount = () => {
    const { dispatch } = useServices(injectDispatch);

    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );
};
