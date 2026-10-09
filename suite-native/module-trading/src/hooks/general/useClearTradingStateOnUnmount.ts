import { useEffect } from 'react';

import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

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
