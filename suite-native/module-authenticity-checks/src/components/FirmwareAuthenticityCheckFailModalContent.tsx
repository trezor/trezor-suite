import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import {
    deviceActions,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';
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
    const isCoinEnablingInitFinished = useSelector(selectIsCoinEnablingInitFinished);
    const device = useSelector(selectSelectedDevice);

    const dismissCheck = () => {
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    const handleClose = () => {
        dismissCheck();

        if (!isDeviceInitialized) {
            navigation.popTo(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
            });
        } else if (!isCoinEnablingInitFinished) {
            navigation.popTo(RootStackRoutes.CoinEnablingInit);
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
