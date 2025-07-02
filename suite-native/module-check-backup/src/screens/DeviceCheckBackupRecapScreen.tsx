import { Box, Button, SwipeableWalkthroughStepHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';

export const DeviceCheckBackupRecapScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack flex={1} justifyContent="space-between" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <SwipeableWalkthroughStepHeader
                        callout={
                            <Translation id="moduleCheckBackup.checkBackupRecapScreen.callout" />
                        }
                        title={<Translation id="moduleCheckBackup.checkBackupRecapScreen.title" />}
                        description={
                            <Translation id="moduleCheckBackup.checkBackupRecapScreen.description" />
                        }
                    />
                </Box>

                <Button onPress={navigateToInitialScreen} isFullWidth>
                    <Translation id="generic.buttons.gotIt" />
                </Button>
            </VStack>
        </Screen>
    );
};
