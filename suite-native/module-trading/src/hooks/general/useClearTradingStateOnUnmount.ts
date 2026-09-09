import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

import { clearTradingStateThunk } from '../../thunks';

export const useClearTradingStateOnUnmount = () => {
    const { dispatch } = useServices(selectDispatch);

    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );
};
