import { INVALID_HASH_ERROR } from '@suite-common/wallet-core';
import { OnboardingStepBox } from '../onboarding';
import { Translation } from '../suite';

type FirmwareUpdateHashCheckErrorProps = {
    error?: string;
};

export const FirmwareUpdateHashCheckError = ({ error }: FirmwareUpdateHashCheckErrorProps) => (
    <OnboardingStepBox
        image="UNI_ERROR"
        heading={<Translation id="TR_FIRMWARE_HASH_MISMATCH" />}
        description={
            // if invalid hash, the firmware is clearly counterfeit. Other error may be transient, so display additional info to help resolve it
            !!error && error !== INVALID_HASH_ERROR ? (
                <Translation id="TOAST_GENERIC_ERROR" values={{ error }} />
            ) : null
        }
        nested
    />
);
