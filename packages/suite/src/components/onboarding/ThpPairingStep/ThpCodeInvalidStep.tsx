import { useState } from 'react';

import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { ThpPairingFailedForFirmwareInstallation, startThpSessionThunk } from '@suite/thp';
import { Column, Paragraph } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

// reflection of suite/thp/src/firmware/ThpCodeInvalidStep.tsx
export const ThpCodeInvalidStep = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleRetry = () => {
        setIsLoading(true);
        // Re-try in firmware-update flow, sends only new UI response, as FW installation flow
        // keeps the TrezorConnect call pending until it's re-paired.
        dispatch(startThpSessionThunk());
    };

    return (
        <OnboardingCard
            iconName="plugsConnected"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={<Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />}
            innerActions={
                <OnboardingCard.Button onClick={handleRetry} isLoading={isLoading}>
                    <Translation id="TR_THP_GET_NEW_CODE" />
                </OnboardingCard.Button>
            }
        >
            <Column gap={24} alignItems="center">
                <ThpPairingFailedForFirmwareInstallation />
                <Paragraph intent="critical">
                    <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                </Paragraph>
            </Column>
        </OnboardingCard>
    );
};
