import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { startThpAutoconnectThunk, thpActions } from '@suite-common/thp';
import { useServices } from '@trezor/dependency-injection';

export const useThpAutoconnectActions = () => {
    const { dispatch } = useServices(injectDispatch);

    const device = useSelector(selectSelectedDevice);

    const startThpAutoconnect = useCallback(async () => {
        if (!device) return;

        const response = await dispatch(startThpAutoconnectThunk({ device }));

        return response;
    }, [device, dispatch]);

    const ignoreThpAutoconnect = useCallback(() => {
        dispatch(thpActions.finishAutoconnectFlow());
    }, [dispatch]);

    return {
        ignoreThpAutoconnect,
        startThpAutoconnect,
    };
};
