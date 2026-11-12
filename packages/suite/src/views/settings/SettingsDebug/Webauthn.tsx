import { useState } from 'react';

import { injectWebauthnAuthenticator } from '@suite-common/platform-encryption';
import { Button, ButtonGroup, Column, Textarea } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem, SettingsSection } from '@trezor/product-components';
import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

const PRF_SALT_HEX = '00'.repeat(32);
const WAITING_MESSAGE = 'Waiting for the authenticator…';

export const Webauthn = () => {
    const isBelowLaptop = useIsContentBelowBreakpoint(breakpoints.laptop);
    const [credentialIdHex, setCredentialIdHex] = useState<string>();
    const [output, setOutput] = useState('');
    const [isPending, setIsPending] = useState(false);

    const { webauthnAuthenticator } = useServices(injectWebauthnAuthenticator);

    const createCredential = async () => {
        setIsPending(true);
        setOutput(WAITING_MESSAGE);
        const result = await webauthnAuthenticator.createCredential();
        setIsPending(false);

        if (!result.success) {
            setOutput(`create failed: ${result.error.message}`);

            return;
        }

        setCredentialIdHex(result.payload.credentialIdHex);
        setOutput(
            [
                `credential id: ${result.payload.credentialIdHex}`,
                `prf enabled: ${result.payload.isPrfEnabled}`,
            ].join('\n'),
        );
    };

    const evaluatePrf = async () => {
        if (credentialIdHex === undefined) {
            setOutput('Create a credential first');

            return;
        }

        setIsPending(true);
        setOutput(WAITING_MESSAGE);
        const result = await webauthnAuthenticator.evaluatePrf({
            credentialIdHex,
            saltHex: PRF_SALT_HEX,
        });
        setIsPending(false);

        setOutput(
            result.success
                ? `prf output: ${result.payload}`
                : `get failed: ${result.error.message}`,
        );
    };

    return (
        <SettingsSection hasVerticalLayout={isBelowLaptop} title="WebAuthn">
            <SectionItem>
                <Column gap={16} flex="1">
                    <Textarea label="Result" value={output} rows={4} isDisabled />
                    <ButtonGroup>
                        <Button
                            onClick={createCredential}
                            isLoading={isPending}
                            isDisabled={isPending}
                        >
                            Create credential with PRF
                        </Button>
                        <Button onClick={evaluatePrf} isLoading={isPending} isDisabled={isPending}>
                            Get assertion with PRF
                        </Button>
                    </ButtonGroup>
                </Column>
            </SectionItem>
        </SettingsSection>
    );
};
