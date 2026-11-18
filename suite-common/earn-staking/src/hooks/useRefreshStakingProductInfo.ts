import { useEffect } from 'react';

import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import {
    type RefreshStakingProductInfoParams,
    refreshStakingProductInfoThunk,
} from '../state/stakingThunks';

export type RefreshStakingProductInfo = (
    params?: RefreshStakingProductInfoParams,
) => Promise<unknown>;

// A screen with a rate or a period asks for product info on mount, within its maximum age, and may
// ask again with `force`; until the scheduler lands these are the refresh paths after startup.
export const useRefreshStakingProductInfo = (): RefreshStakingProductInfo => {
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        dispatch(refreshStakingProductInfoThunk());
    }, [dispatch]);

    return params => dispatch(refreshStakingProductInfoThunk(params));
};
