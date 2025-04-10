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
    DeviceOnboardingStackRoutes.Recovery,
    RootStackParamList
>;

export const RecoveryScreen = () => {
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
        <Screen header={<ScreenHeader content="" />}>
            <Box marginTop="sp16">
                <TitleHeader
                    titleVariant="titleMedium"
                    title={<Translation id="moduleDeviceOnboarding.recovery.title" />}
                    subtitle={<Translation id="moduleDeviceOnboarding.recovery.subtitle" />}
                    titleSpacing="sp12"
                />
            </Box>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp16" marginTop="sp32">
                    <IconListTextItem textVariant="highlight" iconSize="large" icon="browsers">
                        <Translation id="moduleDeviceOnboarding.recovery.step1" />
                    </IconListTextItem>
                    <IconListTextItem textVariant="highlight" iconSize="large" icon="trezorBackup">
                        <Translation id="moduleDeviceOnboarding.recovery.step2" />
                    </IconListTextItem>
                    <IconListTextItem
                        textVariant="highlight"
                        iconSize="large"
                        variant="primary"
                        icon="checkCircle"
                    >
                        <Translation id="moduleDeviceOnboarding.recovery.step3" />
                    </IconListTextItem>
                </VStack>
                <VStack spacing="sp12">
                    <Button viewLeft="arrowSquareOut" onPress={redirectToWeb}>
                        <Translation id="moduleDeviceOnboarding.recovery.redirectButton" />
                    </Button>
                    <Button colorScheme="tertiaryElevation0" onPress={redirectHome}>
                        <Translation id="moduleDeviceOnboarding.recovery.laterButton" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
