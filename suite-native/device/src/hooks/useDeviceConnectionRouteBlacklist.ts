import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigationState } from '@react-navigation/native';

import { selectIsDeviceRemembered } from '@suite-common/wallet-core';
import { RootStackRoutes } from '@suite-native/navigation';

import {
    startDeviceConnectionListening,
    stopDeviceConnectionListening,
} from '../middlewares/deviceConnectionMiddleware';

const DEVICE_CONNECTION_BLACKLISTED_ROUTES: RootStackRoutes[] = [
    RootStackRoutes.DeviceCompromisedModal,
    RootStackRoutes.OnboardingStack,
];

const REMEMBERED_DEVICE_BLACKLISTED_ROUTES: RootStackRoutes[] = [RootStackRoutes.SendStack];

export const useDisableDeviceConnectionOnRouteBlacklist = () => {
    const lastRoute = useNavigationState(state => state?.routes.at(-1)?.name) as RootStackRoutes;
    const isDeviceRemembered = useSelector(selectIsDeviceRemembered);

    const shouldDisableConnection = useMemo(() => {
        if (!lastRoute) return false;

        const isAlwaysBlacklisted = DEVICE_CONNECTION_BLACKLISTED_ROUTES.includes(lastRoute);

        const isConditionallyBlacklisted =
            isDeviceRemembered && REMEMBERED_DEVICE_BLACKLISTED_ROUTES.includes(lastRoute);

        return isAlwaysBlacklisted || isConditionallyBlacklisted;
    }, [lastRoute, isDeviceRemembered]);

    useFocusEffect(
        useCallback(() => {
            if (shouldDisableConnection) {
                stopDeviceConnectionListening();

                return () => {
                    startDeviceConnectionListening();
                };
            }
        }, [shouldDisableConnection]),
    );
};
