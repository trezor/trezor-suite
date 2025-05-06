import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';

export const DeviceAuthenticitySuccessScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" closeAction={navigateToInitialScreen} />}
        >
            <VStack flex={1} spacing="sp32">
                <Box flex={1} justifyContent="center">
                    <PictogramTitleHeader
                        variant="success"
                        title={<Translation id="moduleDeviceSettings.authenticity.success.title" />}
                        titleVariant="titleMedium"
                        subtitle={
                            <Translation id="moduleDeviceSettings.authenticity.success.subtitle" />
                        }
                    />
                </Box>

                <Button
                    colorScheme="primary"
                    onPress={navigateToInitialScreen}
                    testID="@device-authenticity/close-button"
                >
                    <Translation id="generic.buttons.close" />
                </Button>
            </VStack>
        </Screen>
    );
};
