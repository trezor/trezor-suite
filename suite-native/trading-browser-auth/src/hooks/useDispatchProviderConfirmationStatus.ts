import { useCallback } from 'react';

import { tradingActions } from '@suite-native/trading-state';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useDispatchProviderConfirmationStatus = () => {
    const { dispatch } = useServices(injectDispatch);

    return useCallback(
        (status: ProviderConfirmationStatus) => {
            dispatch(tradingActions.setProviderConfirmationStatus(status));
        },
        [dispatch],
    );
};
