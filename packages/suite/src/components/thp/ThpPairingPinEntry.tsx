import { ReactNode, useState } from 'react';

import { Column, PinInput, Row, Spinner, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { SpacingValues, spacings } from '@trezor/theme';

import { Translation } from '../suite';

const SPINNER_SIZE = 32;

type PinInputProps = {
    heading?: ReactNode;
};

export const ThpPairingPinEntry = ({ heading }: PinInputProps) => {
    const [isLoading, setLoading] = useState(false);

    const onCodeEntry = (tag: string) => {
        setLoading(true);
        TrezorConnect.uiResponse({
            type: 'ui-receive_thp_pairing_tag',
            payload: {
                source: 'code-entry',
                tag,
            },
        });
    };

    return (
        <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
            {heading && (
                <Text typographyStyle="titleMedium" align="center">
                    {heading}
                </Text>
            )}
            <Text variant="tertiary" typographyStyle="highlight" align="center">
                <Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />
            </Text>
            <Row
                gap={spacings.xl}
                margin={{
                    right: isLoading
                        ? // This is a bit hack, but I think it is better to make it explicitly
                          // bound to SPINNER_SIZE+gap so it is clear why it is shifted (to prevent jumping)
                          (-(SPINNER_SIZE + spacings.xl) as unknown as SpacingValues)
                        : undefined,
                }}
            >
                <PinInput
                    length={6}
                    onComplete={onCodeEntry}
                    disabled={isLoading}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={true}
                />
                {isLoading && <Spinner size={SPINNER_SIZE} />}
            </Row>
        </Column>
    );
};
