import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
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
        dispatch(thpActions.finishAutoconnectFlow());
    }, [dispatch]);

    return {
        ignoreThpAutoconnect,
        startThpAutoconnect,
    };
};
