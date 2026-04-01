import { useSelector } from 'react-redux';

import {
    selectIsDeviceAuthorized,
    selectIsDeviceConnected,
    selectIsDeviceInBootloader,
    selectIsDeviceInitialized,
    selectIsDeviceThpLocked,
    selectIsPortfolioTrackerDevice,
    selectIsReconnectRequested,
} from '@suite-common/device';
import { selectHasOnlyEmptyPortfolioTracker } from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';
import { selectIsDeviceReadyToUse, selectIsDeviceSetupSupported } from '@suite-native/device';

import { EmptyConnectedDeviceState } from './EmptyConnectedDeviceState';
import { EmptyPortfolioCrossroads } from './EmptyPortfolioCrossroads';
import { EmptyPortfolioTrackerState } from './EmptyPortfolioTrackerState';
import { UninitializedConnectedDeviceState } from './UninitializedConnectedDeviceState';

export const EmptyHomeRenderer = () => {
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

    const isDeviceReadyToUse = useSelector(selectIsDeviceReadyToUse);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isDeviceThpLocked = useSelector(selectIsDeviceThpLocked);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);
    const isReconnectRequested = useSelector(selectIsReconnectRequested);

    // This state is present only for a fraction of second while redirecting to the Connecting screen is already happening.
    // Because the animation takes some time, this makes sure that the screen content of newly selected device does not flash during the redirect.
    if (!isPortfolioTrackerDevice && !isDeviceReadyToUse && isDeviceInitialized) {
        return null;
    }

    let ScreenContent = EmptyPortfolioTrackerState;

    // the reconnect requested flag is set only after the device is wiped. The flag is indicating that the old data state
    // is still present in the redux state but the physical device is already in the `initialize` state and ready for setup.
    const wasDeviceWiped = isReconnectRequested;

    const isUninitializedDeviceSetupReady =
        !isDeviceInitialized &&
        (isDeviceInBootloader || (isDeviceAuthorized && !isDeviceThpLocked));
    const shouldShowUninitializedState =
        isDeviceSetupSupported &&
        isDeviceConnected &&
        (wasDeviceWiped || isUninitializedDeviceSetupReady);

    if (shouldShowUninitializedState) {
        ScreenContent = UninitializedConnectedDeviceState;
    }
    // Crossroads should be displayed if there is no real device connected and portfolio tracker has no accounts
    // or if there is device connected, but not authorized (PIN enter cancelled).
    else if (hasOnlyEmptyPortfolioTracker || !isDeviceAuthorized) {
        ScreenContent = EmptyPortfolioCrossroads;
    } else if (!isPortfolioTrackerDevice && isDeviceAuthorized) {
        ScreenContent = EmptyConnectedDeviceState;
    }

    return (
        <Box marginHorizontal="sp16">
            <ScreenContent />
        </Box>
    );
};
