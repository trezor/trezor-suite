import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { CheckBackupScreenWithExitButton } from '../components/CheckBackupScreenWithExitButton';

export const DeviceCheckBackupFailScreen = ({
    navigation,
}: StackProps<DeviceCheckBackupStackParamList, DeviceCheckBackupStackRoutes.CheckBackupFail>) => {
    const handlePressTryAgain = () => {
        navigation.popTo(DeviceCheckBackupStackRoutes.CheckBackup);
    };

    const handlePressContactSupport = () => {
        navigation.navigate(DeviceCheckBackupStackRoutes.CheckBackupSupport);
    };

    return (
        <CheckBackupScreenWithExitButton>
            <VStack flex={1} justifyContent="space-between" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <PictogramTitleHeader
                        titleVariant="headline-md"
                        variant="warning"
                        title={<Translation id="moduleCheckBackup.checkBackupFailScreen.title" />}
                        subtitle={
                            <Translation id="moduleCheckBackup.checkBackupFailScreen.description" />
                        }
                    />
                </Box>

                <VStack alignSelf="stretch">
                    <Button onPress={handlePressTryAgain} colorScheme="yellowBold" isFullWidth>
                        <Translation id="generic.buttons.tryAgain" />
                    </Button>
                    <Button
                        onPress={handlePressContactSupport}
                        colorScheme="yellowElevation0"
                        isFullWidth
                    >
                        <Translation id="moduleCheckBackup.checkBackupFailScreen.supportButton" />
                    </Button>
                </VStack>
            </VStack>
        </CheckBackupScreenWithExitButton>
    );
};
