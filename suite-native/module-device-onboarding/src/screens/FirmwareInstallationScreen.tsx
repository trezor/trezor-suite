import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { firmwareActions } from '@suite-common/firmware';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { selectDeviceModel } from '@suite-common/wallet-core';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const FirmwareInstallationScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.FirmwareInstallation
>) => {
    const dispatch = useDispatch();
    const deviceModel = useSelector(selectDeviceModel);

    const supportsDeviceAuthentication = deviceModel
        ? SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel]
        : true;

    useEffect(() => {
        // On first render, set the firmware installation status to 'initial'. Some previous failed firmware updates might
        // happened before and we want do avoid showing the "firmware update failed" UI when user returns to this screen.
        dispatch(firmwareActions.setStatus('initial'));
    }, [dispatch]);

    const handleFirmwareInstallationSuccess = () => {
        if (deviceModel === DeviceModelInternal.T2T1) {
            // T2T1 does not support device tutorial and device authenticity check so those screens are skipped.
            navigation.navigate(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
        } else {
            navigation.navigate(
                supportsDeviceAuthentication // TODO: check not only if supported, but also if allowed.
                    ? DeviceOnboardingStackRoutes.DeviceAuthenticity
                    : DeviceOnboardingStackRoutes.DeviceTutorial,
            );
        }
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
