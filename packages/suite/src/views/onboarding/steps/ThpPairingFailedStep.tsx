import { useState } from 'react';

import { Button, Column, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

import { startThpSessionThunk } from '../../../actions/thp/startThpSessionThunk';
import { ThpPairingFailedForFirmwareInstallation } from '../../../components/thp/ThpPairingFailedForFirmwareInstallation';
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
        <OnboardingStepBox
            image="CHECK_SHIELD"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={
                <Text variant="tertiary" typographyStyle="body">
                    <Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />
                </Text>
            }
            device={undefined}
        >
            <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
                <Column gap={spacings.xl} flex="1" justifyContent="center" alignItems="center">
                    <ThpPairingFailedForFirmwareInstallation />
                    <Text variant="destructive">
                        <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                    </Text>
                </Column>
                <Button variant="primary" onClick={handleRetry} isLoading={isLoading}>
                    <Translation id="TR_THP_GET_NEW_CODE" />
                </Button>
            </Column>
        </OnboardingStepBox>
    );
};
