import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type DeviceRootState, selectDeviceButtonRequestsCodes } from '@suite-common/device';

export const useWaitForButtonRequest = (onButtonRequest: () => void) => {
    const [waitingForButtonRequests, setWaitingForButtonRequests] = useState(false);
    const buttonRequestCount = useSelector(
        (state: DeviceRootState) => selectDeviceButtonRequestsCodes(state).length,
    );

    useEffect(() => {
        if (buttonRequestCount > 0 && waitingForButtonRequests) {
            setWaitingForButtonRequests(false);
            onButtonRequest();
        }
    }, [buttonRequestCount, onButtonRequest, waitingForButtonRequests]);

    return useCallback(() => {
        setWaitingForButtonRequests(true);
    }, []);
};
