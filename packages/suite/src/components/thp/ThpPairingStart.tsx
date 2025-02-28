import { useState } from 'react';

import { Button, Column, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Translation } from '../suite';

export const ThpPairingStart = () => {
    const [isLoading, setIsLoading] = useState(false);

    const onClick = () => {
        setIsLoading(true);
        TrezorConnect.uiResponse({ type: 'ui-receive_confirmation', payload: true });
    };

    return (
        <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
            <Text variant="tertiary" typographyStyle="highlight" align="center">
                <Translation id="TR_THP_CREATE_SECURE_CONNECTION_DESCRIPTION" />
            </Text>

            <Button variant="primary" onClick={onClick} isLoading={isLoading}>
                <Translation id="TR_CONTINUE" />
            </Button>
        </Column>
    );
};
