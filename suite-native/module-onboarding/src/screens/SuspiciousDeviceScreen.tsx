import { useSelector } from 'react-redux';

import { selectIsNoPhysicalDeviceConnected } from '@suite-common/wallet-core';
import { Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    AppTabsRoutes,
    DeviceSuspicionCause,
    HomeStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import {
    TREZOR_SUPPORT_DIFFERENT_PACKAGING,
    TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    Url,
} from '@trezor/urls';

const causeToLinkMap = {
    deviceLooksDifferent: TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    firmwareAlreadyInstalled: TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    untrustedReseller: TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    securitySeal: TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    packaging: TREZOR_SUPPORT_DIFFERENT_PACKAGING,
} as const satisfies Record<DeviceSuspicionCause, Url>;

export const SuspiciousDeviceScreen = ({
    route,
    navigation,
}: StackToStackCompositeScreenProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.SuspiciousDevice,
    RootStackParamList
>) => {
    const { suspicionCause } = route.params;
    const openLink = useOpenLink();
    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);

    const supportLink = causeToLinkMap[suspicionCause];

    const handleContactSupportButtonPress = () => {
        openLink(`${supportLink}/#open-chat`);
    };

    const handleBackButtonPress = () => {
        if (isNoPhysicalDeviceConnected) {
            // Exit the onboarding flow if device was disconnected while was user on this screen.
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });

            return;
        }

        navigation.goBack();
    };

    return (
        <Screen header={<ScreenHeader closeAction={handleBackButtonPress} />}>
            <VStack justifyContent="space-between" flex={1} paddingTop="sp16">
                <VStack spacing="sp32">
                    <TitleHeader
                        titleVariant="titleMedium"
                        title={<Translation id="moduleOnboarding.suspiciousDeviceScreen.title" />}
                        subtitle={
                            <Translation id="moduleOnboarding.suspiciousDeviceScreen.subtitle" />
                        }
                    />
                    <VStack spacing="sp24">
                        <IconListTextItem
                            iconSize="large"
                            variant="yellow"
                            textVariant="highlight"
                            icon="plugs"
                        >
                            <Translation id="moduleOnboarding.suspiciousDeviceScreen.bullet1" />
                        </IconListTextItem>
                        <IconListTextItem
                            iconSize="large"
                            variant="yellow"
                            textVariant="highlight"
                            icon="handPalm"
                        >
                            <Translation id="moduleOnboarding.suspiciousDeviceScreen.bullet2" />
                        </IconListTextItem>
                        <IconListTextItem
                            iconSize="large"
                            variant="yellow"
                            textVariant="highlight"
                            icon="chatCircle"
                        >
                            <Translation id="moduleOnboarding.suspiciousDeviceScreen.bullet3" />
                        </IconListTextItem>
                    </VStack>
                </VStack>
                <Button
                    testID="@onboarding/SuspiciousDeviceScreen/contactSupportBtn"
                    colorScheme="yellowBold"
                    onPress={handleContactSupportButtonPress}
                >
                    <Translation id="moduleOnboarding.suspiciousDeviceScreen.contactSupportButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
