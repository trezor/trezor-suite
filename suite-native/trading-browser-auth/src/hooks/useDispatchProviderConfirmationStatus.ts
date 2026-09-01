import { useCallback } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import { tradingActions } from '@suite-native/trading-state';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

export const useDispatchProviderConfirmationStatus = () => {
    const dispatch = useDispatch();

    return useCallback(
        (status: ProviderConfirmationStatus) => {
            dispatch(tradingActions.setProviderConfirmationStatus(status));
        },
        [dispatch],
    );
};
