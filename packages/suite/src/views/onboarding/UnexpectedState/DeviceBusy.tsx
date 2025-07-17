import { Image } from '@trezor/components';

import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

export const DeviceBusy = () => (
    <OnboardingStepBox
        image="FIRMWARE"
        disableConfirmWrapper
        heading={<Translation id="ONBOARDING_UNEXPECTED_DEVICE_BUSY_HEADING" />}
        description={
            <>
                <Image image="DEVICE_CONFIRM_TREZOR_UNKNOWN" />
            </>
        }
    />
);
