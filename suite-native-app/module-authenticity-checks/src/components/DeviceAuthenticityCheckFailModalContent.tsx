import { useSelector } from 'react-redux';

import { deviceActions, selectIsDeviceConnected, selectSelectedDevice } from '@suite-common/device';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    ScreenHeader,
    navigationContainerRef,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { RetryButton } from './RetryButton';

export const DeviceAuthenticityCheckFailModalContent = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const selectedDevice = useSelector(selectSelectedDevice);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const { dispatch } = useServices(injectDispatch);

    const handleClose = () => {
        if (selectedDevice) {
            dispatch(deviceActions.deviceDisconnect(selectedDevice));
        }
        navigateToInitialScreen();
    };

    // The check may have been started from the device onboarding, device settings, or on device connection,
    // but it is always retried in the device onboarding flow. Its screen starts the check on mount,
    // so it is reset to make sure a fresh instance is mounted.
    const handleRetry = () => {
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
                    name: RootStackRoutes.DeviceOnboardingStack,
                    params: {
                        screen: DeviceOnboardingStackRoutes.DeviceAuthenticity,
                    },
                },
            ],
        });
    };

    const screenHeaderContent = <ScreenHeader closeActionType="close" closeAction={handleClose} />;

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL}
            screenHeaderContent={screenHeaderContent}
            closeButtonContent={
                isDeviceConnected ? <RetryButton handleRetry={handleRetry} /> : null
            }
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.deviceAuthenticity" />
            }
        />
    );
};
