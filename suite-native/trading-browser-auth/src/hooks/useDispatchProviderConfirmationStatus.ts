import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { tradingActions } from '@suite-native/trading-state';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

export const useDispatchProviderConfirmationStatus = () => {
    const { dispatch } = useServices(selectDispatch);

    return useCallback(
        (status: ProviderConfirmationStatus) => {
            dispatch(tradingActions.setProviderConfirmationStatus(status));
        },
        [dispatch],
    );
};
