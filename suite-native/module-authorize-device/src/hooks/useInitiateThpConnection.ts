import { useDispatch, useSelector } from 'react-redux';

import { acquireDevice, selectSelectedDevice } from '@suite-common/wallet-core';

export const useInitiateThpConnection = () => {
    const dispatch = useDispatch();

    const device = useSelector(selectSelectedDevice);

    const initiateThpConnection = () => {
        dispatch(acquireDevice({ requestedDevice: device }));
    };

    return {
        initiateThpConnection,
    };
};
