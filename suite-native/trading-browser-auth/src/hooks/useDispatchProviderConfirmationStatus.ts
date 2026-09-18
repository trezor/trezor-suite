import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { tradingActions } from '@suite-native/trading-state';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

export const useDispatchProviderConfirmationStatus = () => {
    const { dispatch } = useServices(injectDispatch);

    return useCallback(
        (status: ProviderConfirmationStatus) => {
            dispatch(tradingActions.setProviderConfirmationStatus(status));
        },
        [dispatch],
    );
};
