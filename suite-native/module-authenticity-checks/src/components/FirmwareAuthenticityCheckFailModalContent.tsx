import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

const supportUrlWithChat = `${TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}#open-chat`;

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const FirmwareAuthenticityCheckFailModalContent = () => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();

    const dismissCheck = () => {
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    // After dismissCheck, an effect could fire in useHandleDeviceConnection to navigate away, but it's not guaranteed!
    // To be sure we don't lock user on on this screen, we navigate home.
    const handleClose = () => {
        // the modal is most likely entered from OnboardingStack, ConnectingDevice or Home, so let's send user back
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        // Home screen set only as fallback if can't go back
        else {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: { screen: HomeStackRoutes.Home },
            });
        }
        dismissCheck();
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
        />
    );
};
