import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
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

// TODO this page is for desktop; await creation of new page tailored to the suite-native UX
const TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL =
    'https://trezor.io/support/a/trezor-fw-revision-check-failed';
const chatUrl = `${TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}#open-chat`;

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
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: { screen: HomeStackRoutes.Home },
        });
        dismissCheck();
    };

    const handleContactSupportClick = () => openLink(chatUrl);

    return (
        <Screen header={<ScreenHeader closeActionType="close" closeAction={handleClose} />}>
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
                <Button colorScheme="redElevation0" onPress={handleClose}>
                    <Translation id="generic.buttons.close" />
                </Button>
            </VStack>
        </Screen>
    );
};
