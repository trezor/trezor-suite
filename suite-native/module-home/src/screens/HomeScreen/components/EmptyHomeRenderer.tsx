import { useSelector } from 'react-redux';

import {
    selectHasOnlyEmptyPortfolioTracker,
    selectIsDeviceAuthorized,
    selectIsDeviceConnected,
    selectIsDeviceInitialized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';
import { selectIsDeviceReadyToUse } from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { EmptyConnectedDeviceState } from './EmptyConnectedDeviceState';
import { EmptyPortfolioCrossroads } from './EmptyPortfolioCrossroads';
import { EmptyPortfolioTrackerState } from './EmptyPortfolioTrackerState';
import { UninitializedConnectedDeviceState } from './UninitializedConnectedDeviceState';

export const EmptyHomeRenderer = () => {
    const isUsbDeviceConnectFeatureEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

    const isDeviceReadyToUse = useSelector(selectIsDeviceReadyToUse);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    // This state is present only for a fraction of second while redirecting to the Connecting screen is already happening.
    // Because the animation takes some time, this makes sure that the screen content of newly selected device does not flash during the redirect.
    if (!isPortfolioTrackerDevice && !isDeviceReadyToUse && isDeviceInitialized) {
        return null;
    }

    let ScreenContent = EmptyPortfolioTrackerState;

    if (isUsbDeviceConnectFeatureEnabled) {
        if (isDeviceConnected && !isDeviceInitialized) {
            ScreenContent = UninitializedConnectedDeviceState;
        }
        // Crossroads should be displayed if there is no real device connected and portfolio tracker has no accounts
        // or if there is device connected, but not authorized (PIN enter cancelled).
        else if (hasOnlyEmptyPortfolioTracker || !isDeviceAuthorized) {
            ScreenContent = EmptyPortfolioCrossroads;
        } else if (!isPortfolioTrackerDevice && isDeviceAuthorized) {
            ScreenContent = EmptyConnectedDeviceState;
        }
    }

    return (
        <Box marginHorizontal="sp16">
            <ScreenContent />
        </Box>
    );
};
