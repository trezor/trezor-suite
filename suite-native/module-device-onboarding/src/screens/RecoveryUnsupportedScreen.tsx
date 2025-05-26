import { useNavigation } from '@react-navigation/core';

import { Box, Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    AppTabsRoutes,
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { SUITE_WEB_URL } from '@trezor/urls';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.RecoveryUnsupported,
    RootStackParamList
>;

export const RecoveryUnsupportedScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const openLink = useOpenLink();

    const redirectToWeb = () => {
        openLink(SUITE_WEB_URL);
    };

    const redirectHome = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    return (
        <Screen header={<ScreenHeader />}>
            <Box marginTop="sp16">
                <TitleHeader
                    titleVariant="titleMedium"
                    title={
                        <Translation id="moduleDeviceOnboarding.recoveryUnsupportedScreen.title" />
                    }
                    subtitle={
                        <Translation id="moduleDeviceOnboarding.recoveryUnsupportedScreen.subtitle" />
                    }
                    titleSpacing="sp12"
                />
            </Box>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp16" marginTop="sp32">
                    <IconListTextItem textVariant="highlight" iconSize="large" icon="browsers">
                        <Translation id="moduleDeviceOnboarding.recoveryUnsupportedScreen.step1" />
                    </IconListTextItem>
                    <IconListTextItem textVariant="highlight" iconSize="large" icon="trezorBackup">
                        <Translation id="moduleDeviceOnboarding.recoveryUnsupportedScreen.step2" />
                    </IconListTextItem>
                    <IconListTextItem
                        textVariant="highlight"
                        iconSize="large"
                        variant="primary"
                        icon="checkCircle"
                    >
                        <Translation id="moduleDeviceOnboarding.recoveryUnsupportedScreen.step3" />
                    </IconListTextItem>
                </VStack>
                <VStack spacing="sp12">
                    <Button viewLeft="arrowSquareOut" onPress={redirectToWeb}>
                        <Translation id="moduleDeviceOnboarding.recoveryUnsupportedScreen.redirectButton" />
                    </Button>
                    <Button colorScheme="tertiaryElevation0" onPress={redirectHome}>
                        <Translation id="moduleDeviceOnboarding.recoveryUnsupportedScreen.laterButton" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
