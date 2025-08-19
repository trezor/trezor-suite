import { Box, Button, SwipeableWalkthroughStepHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

import { CheckBackupScreenWithExitButton } from '../components/CheckBackupScreenWithExitButton';

export const DeviceCheckBackupRecapScreen = ({
    navigation,
}: StackToStackCompositeScreenProps<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes.CheckBackupRecap,
    DeviceSettingsStackParamList
>) => {
    const handleContinueButtonPress = () => {
        navigation.popTo(DeviceSettingsStackRoutes.DeviceSettings);
    };

    return (
        <CheckBackupScreenWithExitButton>
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
                <Button onPress={handleContinueButtonPress} isFullWidth>
                    <Translation id="generic.buttons.gotIt" />
                </Button>
            </VStack>
        </CheckBackupScreenWithExitButton>
    );
};
