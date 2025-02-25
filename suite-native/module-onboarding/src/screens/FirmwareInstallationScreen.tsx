import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import { useToast } from '@suite-native/toasts';

import { OnboardingScreenWithExitButton } from '../components/OnboardingScreenWithExitButton';

export const FirmwareInstallationScreen = () => {
    const { showToast } = useToast();
    const handleFirmwareInstallationSuccess = () => {
        showToast({
            variant: 'warning',
            message: 'Firmware installation successful! TODO: redirect to the device AC screen.',
        });
    };

    return (
        <OnboardingScreenWithExitButton>
            <FirmwareInstallationScreenContent
                onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
                // TODO: will be implemented as part of follow up issue: https://github.com/trezor/trezor-suite/issues/16291
                onFirmwareInstallationFailure={() => null}
            />
        </OnboardingScreenWithExitButton>
    );
};
