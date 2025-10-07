import { useState } from 'react';

import { Column, Paragraph } from '@trezor/components';

import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { Translation } from 'src/components/suite/Translation';

import { startThpSessionThunk } from '../../../actions/thp/startThpSessionThunk';
import { ThpPairingFailedForFirmwareInstallation } from '../../../components/connection/thp/ThpPairingFailedForFirmwareInstallation';
import { useDispatch } from '../../../hooks/suite';

export const ThpPairingFailedStep = () => {
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
            iconName="bluetooth"
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
                <Paragraph variant="destructive">
                    <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                </Paragraph>
            </Column>
        </OnboardingCard>
    );
};
