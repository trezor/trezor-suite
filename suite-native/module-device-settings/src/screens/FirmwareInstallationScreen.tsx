import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectThpStep } from '@suite-common/thp';
import { Box } from '@suite-native/atoms';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    Screen,
    StackNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { useInitiateThpConnection } from '../hooks/useInitiateThpConnection';

type NavigationProp = StackNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.FirmwareInstallation
>;

export const FirmwareInstallationScreen = () => {
    const { initiateThpConnection } = useInitiateThpConnection();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const navigation = useNavigation<NavigationProp>();

    const thpStep = useSelector(selectThpStep);

    const handleFirmwareInstallationSuccess = useCallback(() => {
        if (thpStep === 'BeforeConnectionInfo') {
            initiateThpConnection();
        } else {
            navigateToInitialScreen();
        }
    }, [thpStep, initiateThpConnection, navigateToInitialScreen]);

    const handleFirmwareInstallationFailure = useCallback(() => {
        navigation.navigate(FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate);
    }, [navigation]);

    return (
        <Screen>
            <Box flex={1}>
                <FirmwareInstallationScreenContent
                    onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
                    onFirmwareInstallationFailure={handleFirmwareInstallationFailure}
                    navigationLocation="settings"
                />
            </Box>
        </Screen>
    );
};
