import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { deviceActions, selectIsDeviceConnected, selectSelectedDevice } from '@suite-common/device';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { RetryButton } from './RetryButton';

type NavigationProps = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.DeviceCompromisedModal,
    RootStackParamList
>;

export const DeviceAuthenticityCheckFailModalContent = () => {
    const navigation = useNavigation<NavigationProps>();
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

    const handleRetry = () => {
        navigation.popTo(RootStackRoutes.DeviceOnboardingStack, {
            screen: DeviceOnboardingStackRoutes.DeviceAuthenticity,
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
