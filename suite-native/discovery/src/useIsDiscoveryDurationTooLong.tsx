import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    selectDiscoveryForSelectedDevice,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { IntervalId } from '@trezor/type-utils';

const DISCOVERY_LENGTH_CHECK_INTERVAL = 1_000;
const DISCOVERY_DURATION_THRESHOLD = 50_000;

export const useIsDiscoveryDurationTooLong = () => {
    const discovery = useSelector(selectDiscoveryForSelectedDevice);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const [loadingTakesLongerThanExpected, setLoadingTakesLongerThanExpected] = useState(false);

    useEffect(() => {
        let interval: IntervalId;
        const startTimestamp = discovery?.startTimestamp;
        if (isDiscoveryRunning && startTimestamp !== undefined) {
            interval = setInterval(() => {
                if (Date.now() - startTimestamp > DISCOVERY_DURATION_THRESHOLD) {
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
    }, [discovery, isDiscoveryRunning]);

    return loadingTakesLongerThanExpected;
};
