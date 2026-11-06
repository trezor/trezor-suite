import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    navigationContainerRef,
} from '@suite-native/navigation';

/**
 * An initialized device goes through the device onboarding flow only to pass the interactive device checks
 * (Device Visual Check, Device Authenticity Check). Afterwards, the flow is exited to the same flow
 * as when an initialized device is connected.
 */
export const useExitDeviceOnboardingForInitializedDevice = () => {
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);
    const hasDeviceBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    const exitDeviceOnboardingForInitializedDevice = () => {
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
