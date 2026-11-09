import { useSelector } from 'react-redux';

import { selectDeviceName } from '@suite-common/device';
import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type DeviceOnboardingStackParamList,
    type DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

export const CongratulationsScreen = ({
    navigation,
}: StackToStackCompositeScreenProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.Congratulations,
    RootStackParamList
>) => {
    const deviceName = useSelector(selectDeviceName);

    const navigateToHome = () =>
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" closeAction={navigateToHome} />}
            isScrollable={false}
        >
            <VStack flex={1} spacing="sp32">
                <Box flex={1} justifyContent="center">
                    <PictogramTitleHeader
                        variant="success"
                        title={
                            <Translation id="moduleDeviceOnboarding.congratulationsScreen.title" />
                        }
                        titleVariant="headline-md"
                        subtitle={
                            <Translation
                                id="moduleDeviceOnboarding.congratulationsScreen.subtitle"
                                values={{ deviceName }}
                            />
                        }
                    />
                </Box>
                <Button
                    onPress={navigateToHome}
                    testID="@deviceOnboarding/CongratulationsScreen/continueButton"
                >
                    <Translation id="moduleDeviceOnboarding.congratulationsScreen.continueButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
