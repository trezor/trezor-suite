import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { startThpAutoconnectThunk, thpActions } from '@suite-common/thp';

export const useThpAutoconnectActions = () => {
    const dispatch = useDispatch();

    const device = useSelector(selectSelectedDevice);

    const startThpAutoconnect = useCallback(async () => {
        if (!device) return;

        const response = await dispatch(startThpAutoconnectThunk({ device }));

        return response;
    }, [device, dispatch]);

    const ignoreThpAutoconnect = useCallback(() => {
        dispatch(thpActions.finishThpFlow());
    }, [dispatch]);

    return {
        ignoreThpAutoconnect,
        startThpAutoconnect,
    };
};
