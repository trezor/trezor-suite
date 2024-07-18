import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';

import { selectDiscoveryInfo } from './discoveryConfigSlice';

const DISCOVERY_LENGTH_CHECK_INTERVAL = 1_000;
const DISCOVERY_DURATION_THRESHOLD = 50_000;

export const useIsDiscoveryDurationTooLong = () => {
    const discoveryInfo = useSelector(selectDiscoveryInfo);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const [loadingTakesLongerThanExpected, setLoadingTakesLongerThanExpected] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isDiscoveryActive && discoveryInfo?.startTimestamp) {
            interval = setInterval(() => {
                if (
                    performance.now() - discoveryInfo.startTimestamp >
                    DISCOVERY_DURATION_THRESHOLD
                ) {
                    setLoadingTakesLongerThanExpected(true);
                    clearInterval(interval);
                }
            }, DISCOVERY_LENGTH_CHECK_INTERVAL);
        } else {
            setLoadingTakesLongerThanExpected(false);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isDiscoveryActive, discoveryInfo]);

    return loadingTakesLongerThanExpected;
};
