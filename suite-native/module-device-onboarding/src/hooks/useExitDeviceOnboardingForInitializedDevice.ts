import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    navigationContainerRef,
} from '@suite-native/navigation';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

/**
 * An initialized device goes through the device onboarding flow only to pass the interactive device checks
 * (Manual Device Check, Device Authenticity Check). Afterwards, the flow is exited to the same flow
 * as when an initialized device is connected.
 */
export const useExitDeviceOnboardingForInitializedDevice = () => {
    const device = useSelector(selectSelectedDevice);
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);

    const exitDeviceOnboardingForInitializedDevice = () => {
        // `setWasDeviceOnboardingCancelled` is intentionally omitted: passing the checks is not a cancellation,
        // and the device doesn't need the rest of the onboarding anyway.
        const hasDeviceBitcoinOnlyFirmware = !!device && hasBitcoinOnlyFirmware(device);
        const isCoinEnablingNeeded = !isAnyNetworkEnabled && !hasDeviceBitcoinOnlyFirmware;

        // Reset, so that navigating back doesn't return to the onboarding flow.
        navigationContainerRef.reset({
            index: 1,
            routes: [
                {
                    name: RootStackRoutes.AppTabs,
                    params: {
                        screen: AppTabsRoutes.HomeStack,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                },
                {
                    name: RootStackRoutes.AuthorizeDeviceStack,
                    params: {
                        screen: isCoinEnablingNeeded
                            ? AuthorizeDeviceStackRoutes.CoinEnablingInit
                            : AuthorizeDeviceStackRoutes.ConnectingDevice,
                    },
                },
            ],
        });
    };

    return { exitDeviceOnboardingForInitializedDevice };
};
