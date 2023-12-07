import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';

import { selectDiscoveryStartTimeStamp } from './discoveryConfigSlice';

const DISCOVERY_LENGTH_CHECK_INTERVAL = 1000;
const DISCOVERY_DURATION_TRESHOLD = 10000;

export const useIsDiscoveryDurationTooLong = () => {
    const startDiscoveryTimestamp = useSelector(selectDiscoveryStartTimeStamp);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const [loadingTakesLongerThanExpected, setLoadingTakesLongerThanExpected] = useState(false);

    useEffect(() => {
        if (isDiscoveryActive && startDiscoveryTimestamp) {
            const interval = setInterval(() => {
                if (performance.now() - startDiscoveryTimestamp > DISCOVERY_DURATION_TRESHOLD) {
                    setLoadingTakesLongerThanExpected(true);
                    clearInterval(interval);
                }
            }, DISCOVERY_LENGTH_CHECK_INTERVAL);

            return () => clearInterval(interval);
        }
        setLoadingTakesLongerThanExpected(false);
    }, [isDiscoveryActive, startDiscoveryTimestamp]);

    return loadingTakesLongerThanExpected;
};
