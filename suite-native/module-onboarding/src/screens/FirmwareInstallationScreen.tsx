import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import { Screen } from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

export const FirmwareInstallationScreen = () => {
    const { showToast } = useToast();
    const handleFirmwareInstallationSuccess = () => {
        showToast({
            variant: 'warning',
            message: 'Firmware installation successful! TODO: redirect to the device AC screen.',
        });
    };

    return (
        <Screen>
            <FirmwareInstallationScreenContent
                onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
                // TODO: will be implemented as part of follow up issue: https://github.com/trezor/trezor-suite/issues/16291
                onFirmwareInstallationFailure={() => null}
            />
        </Screen>
    );
};
