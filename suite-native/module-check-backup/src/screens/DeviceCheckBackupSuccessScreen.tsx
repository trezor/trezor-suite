import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

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
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack flex={1} justifyContent="space-between" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <PictogramTitleHeader
                        titleVariant="titleMedium"
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
        </Screen>
    );
};
