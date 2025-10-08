import { createMiddleware } from '@suite-common/redux-utils';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    DeviceSettingsStackRoutes,
    RootStackRoutes,
    checkIsActiveRouteAnyOf,
    navigationContainerRef,
} from '@suite-native/navigation';

import { isPinRequestAction } from './utils';

const pinMatrixBlacklistedScreens = [
    RootStackRoutes.DeviceSettingsStack,
    ...Object.values(DeviceSettingsStackRoutes),
    RootStackRoutes.DeviceOnboardingStack,
    ...Object.values(DeviceOnboardingStackRoutes),
];

export const deviceAuthorizationMiddleware = createMiddleware((action, { next }) => {
    if (isPinRequestAction(action)) {
        const isOnPinMatrixBlacklistedRoute = checkIsActiveRouteAnyOf(pinMatrixBlacklistedScreens);

        if (!isOnPinMatrixBlacklistedRoute) {
            navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PinMatrix,
            });
        }
    }

    return next(action);
});
