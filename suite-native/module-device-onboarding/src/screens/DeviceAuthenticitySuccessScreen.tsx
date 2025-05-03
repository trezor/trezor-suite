import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const DeviceAuthenticitySuccessScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess
>) => {
    const handleContinueButtonPress = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.DeviceTutorial);
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <VStack flex={1} spacing="sp32">
                <Box flex={1} justifyContent="center">
                    <PictogramTitleHeader
                        variant="success"
                        title={
                            <Translation id="moduleDeviceOnboarding.deviceAuthenticitySuccessScreen.title" />
                        }
                        titleVariant="titleMedium"
                        subtitle={
                            <Translation id="moduleDeviceOnboarding.deviceAuthenticitySuccessScreen.subtitle" />
                        }
                    />
                </Box>

                <Button
                    onPress={handleContinueButtonPress}
                    testID="@device-authenticity/continue-button"
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};
