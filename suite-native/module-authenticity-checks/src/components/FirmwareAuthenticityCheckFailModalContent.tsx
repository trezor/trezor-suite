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
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

const supportUrlWithChat = `${TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}#open-chat`;

type NavigationProps = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.DeviceCompromisedModal,
    RootStackParamList
>;

export const FirmwareAuthenticityCheckFailModalContent = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

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

        if (!isCoinEnablingInitFinished && isDeviceInitialized) {
            navigation.navigate(RootStackRoutes.CoinEnablingInit);
        } else {
            if (navigation.canGoBack()) navigation.goBack();
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
            contactSupportUrl={supportUrlWithChat}
            screenHeaderContent={screenHeaderContent}
            closeButtonContent={closeButtonContent}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.fwRevision" />
            }
        />
    );
};
