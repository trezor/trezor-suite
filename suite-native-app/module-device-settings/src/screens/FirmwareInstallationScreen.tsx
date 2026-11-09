import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectThpStep } from '@suite-common/thp';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { useInitiateThpConnection } from '../hooks/useInitiateThpConnection';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.FirmwareUpdateStack
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
        navigation.popTo(DeviceSettingsStackRoutes.FirmwareUpdateStack);
    }, [navigation]);

    return (
        <FirmwareInstallationScreenContent
            onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
            onFirmwareInstallationFailure={handleFirmwareInstallationFailure}
            navigationLocation="settings"
        />
    );
};
