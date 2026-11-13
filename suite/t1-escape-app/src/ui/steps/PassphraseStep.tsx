import { useState } from 'react';

import { Banner, Button, Card, Column, H2, Input, Paragraph } from '@trezor/components';

import type { PassphraseEntryError } from '../../device/passphrase';
import { describePassphraseError } from '../messages';

type PassphraseStepProps = {
    error?: PassphraseEntryError;
    isBusy: boolean;
    onSubmit: (first: string, second: string) => void;
};

// A masked text field instead of a password field: browsers offer to save password fields,
// and spell checking may send what is typed to a remote service. Neither may happen here.
const SECRET_INPUT_PROPS = {
    type: 'text',
    isMasked: true,
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
} as const;

export const PassphraseStep = ({ error, isBusy, onSubmit }: PassphraseStepProps) => {
    // The passphrase lives in component memory only until it is handed to the controller.
    const [first, setFirst] = useState('');
    const [second, setSecond] = useState('');

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>Passphrase</H2>
                <Paragraph>
                    Passphrase protection is turned on for this Trezor. Each passphrase opens a
                    different wallet. Enter the passphrase of the wallet you want to empty. Leave
                    both fields empty for the standard wallet without a passphrase.
                </Paragraph>
                <Banner
                    intent="warning"
                    description="This firmware never shows the passphrase on its display, so a typing mistake cannot be noticed there. A wrong passphrase opens a different, empty wallet. That is why it is entered twice."
                />
                <Input
                    {...SECRET_INPUT_PROPS}
                    label="Passphrase"
                    value={first}
                    onChange={event => setFirst(event.target.value)}
                />
                <Input
                    {...SECRET_INPUT_PROPS}
                    label="Passphrase again"
                    value={second}
                    hasError={error !== undefined}
                    bottomText={error ? describePassphraseError(error) : undefined}
                    onChange={event => setSecond(event.target.value)}
                />
                <Button isLoading={isBusy} onClick={() => onSubmit(first, second)}>
                    Search this wallet
                </Button>
            </Column>
        </Card>
    );
};
