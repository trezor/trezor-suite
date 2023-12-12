import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceDiscoveryActive, selectIsPortfolioEmpty } from '@suite-common/wallet-core';

import { selectDiscoveryStartTimeStamp } from './discoveryConfigSlice';

const DISCOVERY_LENGTH_CHECK_INTERVAL = 1_000;
const DISCOVERY_DURATION_TRESHOLD = 45_000;
const FIRST_ASSET_DISCOVERY_DURATION_TRESHOLD = 10_000;

export const useIsDiscoveryDurationTooLong = () => {
    const startDiscoveryTimestamp = useSelector(selectDiscoveryStartTimeStamp);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);

    const [loadingTakesLongerThanExpected, setLoadingTakesLongerThanExpected] = useState(false);

    const handleSetLoadingTakesLongerThanExpected = useCallback(
        (interval: any) => {
            setLoadingTakesLongerThanExpected(true);
            clearInterval(interval);
        },
        [setLoadingTakesLongerThanExpected],
    );

    useEffect(() => {
        let interval: any;
        if (isDiscoveryActive && startDiscoveryTimestamp) {
            interval = setInterval(() => {
                const currentDuration = performance.now() - startDiscoveryTimestamp;
                if (currentDuration > DISCOVERY_DURATION_TRESHOLD) {
                    handleSetLoadingTakesLongerThanExpected(interval);
                }
                if (isPortfolioEmpty && currentDuration > FIRST_ASSET_DISCOVERY_DURATION_TRESHOLD) {
                    handleSetLoadingTakesLongerThanExpected(interval);
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
    }, [
        handleSetLoadingTakesLongerThanExpected,
        isDiscoveryActive,
        isPortfolioEmpty,
        startDiscoveryTimestamp,
    ]);

    return loadingTakesLongerThanExpected;
};
