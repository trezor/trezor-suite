import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { selectIsEntropyCheckEnabledAndFailed } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

const chatUrl = `${TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}#open-chat`;

const InformativeList = () => (
    <VStack spacing="sp24">
        <IconListTextItem icon="plugs" variant="red">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.disconnectDevice" />
        </IconListTextItem>

        <IconListTextItem icon="handPalm" variant="red">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.avoidUsingDevice" />
        </IconListTextItem>

        <IconListTextItem icon="chatCircle" variant="red">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.contactSupport" />
        </IconListTextItem>
    </VStack>
);

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const DeviceCompromisedModalScreen = () => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const openLink = useOpenLink();
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

    const handleContactSupportClick = () => openLink(chatUrl);

    const isEntropyCheckEnabledAndFailed = useSelector(selectIsEntropyCheckEnabledAndFailed);
    const isDismissible = !isEntropyCheckEnabledAndFailed;
    const screenHeaderContent = isDismissible ? (
        <ScreenHeader closeActionType="close" closeAction={handleClose} />
    ) : null;
    const closeButtonContent = isDismissible ? (
        <Button colorScheme="redElevation0" onPress={handleClose}>
            <Translation id="generic.buttons.close" />
        </Button>
    ) : null;

    return (
        <Screen header={screenHeaderContent}>
            <VStack spacing="sp32" flex={1}>
                <TitleHeader
                    titleVariant="titleMedium"
                    titleSpacing="sp12"
                    title={<Translation id="moduleAuthenticityChecks.deviceCompromised.title" />}
                    subtitle={
                        <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle" />
                    }
                />
                <InformativeList />
            </VStack>
            <VStack spacing="sp12">
                <Button colorScheme="redBold" onPress={handleContactSupportClick}>
                    <Translation id="moduleAuthenticityChecks.deviceCompromised.buttonContactSupport" />
                </Button>
                {closeButtonContent}
            </VStack>
        </Screen>
    );
};
