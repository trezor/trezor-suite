import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    deviceActions,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { selectIsDeviceSetupSupported } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

type NavigationProps = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.DeviceCompromisedModal,
    RootStackParamList
>;

export const FirmwareAuthenticityCheckFailModalContent = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);
    const device = useSelector(selectSelectedDevice);

    const dismissCheck = () => {
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    const handleClose = () => {
        dismissCheck();

        if (!isDeviceInitialized && isDeviceSetupSupported) {
            navigation.popTo(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
                params: {
                    deviceModel: getDeviceInternalModel(device),
                },
            });
        } else if (!isAnyNetworkEnabled) {
            navigation.popTo(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
            });
        } else {
            navigateToInitialScreen();
        }
    };

    const screenHeaderContent = <ScreenHeader closeActionType="close" closeAction={handleClose} />;

    const closeButtonContent = (
        <Button colorScheme="redElevation0" onPress={handleClose}>
            <Translation id="generic.buttons.close" />
        </Button>
    );

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}
            screenHeaderContent={screenHeaderContent}
            closeButtonContent={closeButtonContent}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.fwRevision" />
            }
        />
    );
};
