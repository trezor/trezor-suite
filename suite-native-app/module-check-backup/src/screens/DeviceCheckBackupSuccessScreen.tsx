import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { CheckBackupScreenWithExitButton } from '../components/CheckBackupScreenWithExitButton';

export const DeviceCheckBackupSuccessScreen = ({
    navigation,
}: StackProps<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes.CheckBackupSuccess
>) => {
    const handleContinueButtonPress = () => {
        navigation.navigate(DeviceCheckBackupStackRoutes.CheckBackupRecap);
    };

    return (
        <CheckBackupScreenWithExitButton>
            <VStack flex={1} justifyContent="space-between" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <PictogramTitleHeader
                        titleVariant="headline-md"
                        variant="success"
                        title={
                            <Translation id="moduleCheckBackup.checkBackupSuccessScreen.title" />
                        }
                    />
                </Box>

                <Button onPress={handleContinueButtonPress} isFullWidth>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </CheckBackupScreenWithExitButton>
    );
};
