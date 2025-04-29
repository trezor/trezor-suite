import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { firmwareActions } from '@suite-common/firmware';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const FirmwareInstallationScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.FirmwareInstallation
>) => {
    const dispatch = useDispatch();

    useEffect(() => {
        // On first render, set the firmware installation status to 'initial'. Some previous failed firmware updates might
        // happened before and we want do avoid showing the "firmware update failed" UI when user returns to this screen.
        dispatch(firmwareActions.setStatus('initial'));
    }, [dispatch]);

    const handleFirmwareInstallationSuccess = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.DeviceTutorial);
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <FirmwareInstallationScreenContent
                onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
                isCancellationAllowed={false}
                isRetryAllowed={false}
                isTemporaryRememeberAllowed={false}
                navigationLocation="onboarding"
            />
        </DeviceOnboardingScreenWithExitButton>
    );
};
