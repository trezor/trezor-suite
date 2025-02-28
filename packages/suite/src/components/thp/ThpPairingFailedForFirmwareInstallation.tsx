import { useState } from 'react';

import { Button, Column, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Translation } from '../suite';

export const ThpPairingFailedForFirmwareInstallation = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleRetry = () => {
        setIsLoading(true);
        // Re-try in firmware-update flow, sends only new UI response, as FW installation flow
        // keeps the TrezorConnect call pending, until its re-paired.
        TrezorConnect.uiResponse({ type: 'ui-receive_confirmation', payload: true });
    };

    return (
        <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
            <Text variant="tertiary" typographyStyle="highlight" align="center">
                <Translation id="TR_THP_VERIFICATION_FAILED_DESCRIPTION" />
            </Text>

            <Button variant="primary" onClick={handleRetry} isLoading={isLoading}>
                <Translation id="TR_TRY_AGAIN" />
            </Button>
        </Column>
    );
};
