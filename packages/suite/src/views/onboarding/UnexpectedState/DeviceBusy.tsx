import { useFirmwareInstallation } from '@suite-common/firmware';
import { Image } from '@trezor/components';

import { OnboardingStepBox } from 'src/components/onboarding';

export const DeviceBusy = () => {
    const { cachedDevice } = useFirmwareInstallation();
    const model = cachedDevice?.features?.internal_model || 'UNKNOWN';

    return (
        <OnboardingStepBox
            image="FIRMWARE"
            disableConfirmWrapper={false}
            device={cachedDevice}
            description={
                <>
                    <Image image={`DEVICE_CONFIRM_TREZOR_${model}`} />
                </>
            }
        />
    );
};
