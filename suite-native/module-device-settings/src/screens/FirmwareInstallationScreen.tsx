import { useNavigation } from '@react-navigation/native';

import { Box } from '@suite-native/atoms';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    Screen,
    StackNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.FirmwareInstallation
>;

export const FirmwareInstallationScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const navigation = useNavigation<NavigationProp>();

    const handleFirmwareInstallationFailure = () => {
        navigation.navigate(FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate);
    };

    return (
        <Screen>
            <Box flex={1}>
                <FirmwareInstallationScreenContent
                    onFirmwareInstallationSuccess={navigateToInitialScreen}
                    onFirmwareInstallationFailure={handleFirmwareInstallationFailure}
                    navigationLocation="settings"
                />
            </Box>
        </Screen>
    );
};
