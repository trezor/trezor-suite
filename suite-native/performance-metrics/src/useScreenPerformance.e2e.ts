import { useCallback, useEffect } from 'react';
import {
    type PerformanceMetrics,
    type PerformanceScore,
    usePerformanceMeasurement,
} from 'react-native-lighthouse';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type DeviceRootState } from '@suite-common/device';
import { type ReceiveRootState, selectCurrentFreshAddress } from '@suite-common/receive';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    selectDeviceAccounts,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { FID_TIMEOUT_MS } from './constants';
import { logPerformanceSample } from './performanceLog';
import { createPerformanceSample } from './performanceSample';
import { type PerformanceScreen, type ScreenPerformance } from './types';

// Only the receive route is read here, but the hook runs on every instrumented screen, so the
// param list is the structural minimum rather than a navigator's own type.
type AccountKeyRoute = RouteProp<{ screen: { accountKey?: AccountKey } | undefined }, 'screen'>;

// Readiness lives here and not in the screens so that a production build, which resolves the
// inert twin of this file, pays for none of these subscriptions.
const useIsScreenReady = (screen: PerformanceScreen, isReady?: boolean) => {
    const { params } = useRoute<AccountKeyRoute>();

    const hasSettledDiscovery = !useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectHasRunningDiscovery(state),
    );
    const hasAccountToSelect = useSelector(
        (state: AccountsRootState & DeviceRootState) => selectDeviceAccounts(state).length > 0,
    );
    const hasFreshReceiveAddress = useSelector(
        (state: ReceiveRootState) => !!selectCurrentFreshAddress(state, params?.accountKey),
    );

    switch (screen) {
        // Balances and the graph keep changing until discovery settles.
        case 'home':
            return hasSettledDiscovery;
        // The only thing to interact with on the accounts list is an account row.
        case 'accounts':
            return hasAccountToSelect;
        // The address is what the user came for, everything before it is a loader.
        case 'receive':
            return hasFreshReceiveAddress;
        // Readiness is component state these screens already hold, so they pass it in.
        case 'send':
        case 'account-detail':
            return isReady ?? false;
        default:
            return exhaustive(screen);
    }
};

export const useScreenPerformance = (
    screen: PerformanceScreen,
    isReady?: boolean,
): ScreenPerformance => {
    const handleReport = useCallback(
        (metrics: PerformanceMetrics, score: PerformanceScore) =>
            logPerformanceSample(createPerformanceSample({ screen, metrics, score })),
        [screen],
    );

    const { markInteractive, panResponder } = usePerformanceMeasurement({
        componentName: screen,
        fidTimeout: FID_TIMEOUT_MS,
        debug: false,
        onReport: handleReport,
    });

    const isScreenReady = useIsScreenReady(screen, isReady);

    useEffect(() => {
        if (isScreenReady) {
            markInteractive();
        }
    }, [isScreenReady, markInteractive]);

    return { markInteractive, panHandlers: panResponder.panHandlers };
};
