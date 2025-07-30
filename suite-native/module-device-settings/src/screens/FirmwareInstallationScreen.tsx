import { useNavigation } from '@react-navigation/native';

import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
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
        <FirmwareInstallationScreenContent
            onFirmwareInstallationSuccess={navigateToInitialScreen}
            onFirmwareInstallationFailure={handleFirmwareInstallationFailure}
            navigationLocation="settings"
        />
    );
};
