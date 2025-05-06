import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { selectDeviceModel, selectHasDeviceFirmwareInstalled } from '@suite-common/wallet-core';
import { selectIsDeviceFirmwareSupported } from '@suite-native/device';
import {
    ConfirmFirmwareUpdateScreenContent,
    ConfirmFirmwareUpdateScreenFooter,
} from '@suite-native/firmware';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const ConfirmFirmwareUpdateScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate
>) => {
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);
    const deviceModel = useSelector(selectDeviceModel);

    const handleUpdateConfirmation = () => {
        updateOnboardingAnalytics({
            firmware: hasDeviceFirmwareInstalled ? 'update' : 'install',
        });
        navigation.navigate(DeviceOnboardingStackRoutes.FirmwareInstallation);
    };

    const supportsDeviceAuthentication = deviceModel
        ? SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel]
        : true;

    const handleSkipUpdate = () => {
        updateOnboardingAnalytics({
            firmware: 'skip',
        });
        navigation.navigate(
            supportsDeviceAuthentication // TODO: check not only if supported, but also if allowed.
                ? DeviceOnboardingStackRoutes.DeviceAuthenticity
                : DeviceOnboardingStackRoutes.DeviceTutorial,
        );
    };

    return (
        <DeviceOnboardingScreenWithExitButton
            footer={
                <ConfirmFirmwareUpdateScreenFooter
                    onUpdateConfirmation={handleUpdateConfirmation}
                    // Skip action is disabled for devices with unsupported (outdated) firmware.
                    onSkipUpdate={isDeviceFirmwareSupported ? handleSkipUpdate : undefined}
                />
            }
        >
            <ConfirmFirmwareUpdateScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
