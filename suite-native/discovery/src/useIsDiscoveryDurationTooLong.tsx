import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    selectDiscoveryStartTimestampForSelectedDevice,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { type IntervalId } from '@trezor/type-utils';

const DISCOVERY_LENGTH_CHECK_INTERVAL = 1_000;
const DISCOVERY_DURATION_THRESHOLD = 50_000;

export const useIsDiscoveryDurationTooLong = () => {
    const discoveryStartTimestamp = useSelector(selectDiscoveryStartTimestampForSelectedDevice);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const [loadingTakesLongerThanExpected, setLoadingTakesLongerThanExpected] = useState(false);

    useEffect(() => {
        let interval: IntervalId;
        if (isDiscoveryRunning && discoveryStartTimestamp !== undefined) {
            interval = setInterval(() => {
                if (Date.now() - discoveryStartTimestamp > DISCOVERY_DURATION_THRESHOLD) {
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
    }, [discoveryStartTimestamp, isDiscoveryRunning]);

    return loadingTakesLongerThanExpected;
};
