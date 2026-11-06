import { useSelector } from 'react-redux';

import { selectDeviceName, selectIsDeviceInitialized } from '@suite-common/device';
import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useExitDeviceOnboardingForInitializedDevice } from '../hooks/useExitDeviceOnboardingForInitializedDevice';

export const DeviceAuthenticitySuccessScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess
>) => {
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const { exitDeviceOnboardingForInitializedDevice } =
        useExitDeviceOnboardingForInitializedDevice();

    const deviceName = useSelector(selectDeviceName);

    const handleContinueButtonPress = () => {
        if (isDeviceInitialized) {
            exitDeviceOnboardingForInitializedDevice();
        } else {
            navigation.navigate(DeviceOnboardingStackRoutes.DeviceTutorial);
        }
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
                        titleVariant="headline-md"
                        subtitle={
                            <Translation
                                id="moduleDeviceOnboarding.deviceAuthenticitySuccessScreen.subtitle"
                                values={{ deviceName }}
                            />
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
