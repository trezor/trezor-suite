import { useEffect, useState } from 'react';

import { Button, ButtonGroup, Column, Textarea } from '@trezor/components';
import { SectionItem, SettingsSection } from '@trezor/product-components';
import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

const RELYING_PARTY_NAME = 'Trezor Suite debug';
const PRF_SALT = new TextEncoder().encode('trezor-suite-webauthn-debug');
const REQUEST_TIMEOUT_MS = 60_000;
const WAITING_MESSAGE =
    'Waiting for the authenticator, touch the security key if one is plugged in...';

const bytesToHex = (bytes: Uint8Array<ArrayBuffer>): string =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

const getRandomBytes = (length: number): Uint8Array<ArrayBuffer> =>
    crypto.getRandomValues(new Uint8Array(length));

const describeError = (error: unknown): string =>
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const isWebauthnAvailable = (): boolean =>
    window.isSecureContext && typeof PublicKeyCredential !== 'undefined';

const getEnvironmentReport = async (): Promise<string> => {
    const lines = [
        `origin: ${window.location.origin}`,
        `secure context: ${window.isSecureContext}`,
        `PublicKeyCredential: ${typeof PublicKeyCredential !== 'undefined'}`,
    ];

    if (isWebauthnAvailable()) {
        const hasPlatformAuthenticator =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        lines.push(`platform authenticator: ${hasPlatformAuthenticator}`);
    }

    return lines.join('\n');
};

export const Webauthn = () => {
    const isBelowLaptop = useIsContentBelowBreakpoint(breakpoints.laptop);
    const [credentialId, setCredentialId] = useState<Uint8Array<ArrayBuffer>>();
    const [output, setOutput] = useState('');
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        getEnvironmentReport().then(setOutput);
    }, []);

    const createCredential = async () => {
        if (!isWebauthnAvailable()) {
            setOutput('WebAuthn is not available in this context');

            return;
        }

        setIsPending(true);
        setOutput(WAITING_MESSAGE);
        try {
            const credential = await navigator.credentials.create({
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                publicKey: {
                    rp: { id: window.location.hostname, name: RELYING_PARTY_NAME },
                    user: {
                        id: getRandomBytes(16),
                        name: RELYING_PARTY_NAME,
                        displayName: RELYING_PARTY_NAME,
                    },
                    challenge: getRandomBytes(32),
                    pubKeyCredParams: [
                        { type: 'public-key', alg: -7 },
                        { type: 'public-key', alg: -257 },
                    ],
                    authenticatorSelection: {
                        residentKey: 'required',
                        userVerification: 'preferred',
                    },
                    extensions: { prf: {} },
                },
            });

            if (!(credential instanceof PublicKeyCredential)) {
                setOutput('No credential was created');

                return;
            }

            const id = new Uint8Array(credential.rawId);
            setCredentialId(id);
            setOutput(
                [
                    `credential id: ${bytesToHex(id)}`,
                    `prf enabled: ${credential.getClientExtensionResults().prf?.enabled ?? 'not reported'}`,
                    `transports: ${credential.response instanceof AuthenticatorAttestationResponse ? credential.response.getTransports().join(', ') : 'unknown'}`,
                ].join('\n'),
            );
        } catch (error) {
            setOutput(`create failed: ${describeError(error)}`);
        } finally {
            setIsPending(false);
        }
    };

    const getAssertion = async () => {
        if (!isWebauthnAvailable()) {
            setOutput('WebAuthn is not available in this context');

            return;
        }

        setIsPending(true);
        setOutput(WAITING_MESSAGE);
        try {
            const assertion = await navigator.credentials.get({
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                publicKey: {
                    rpId: window.location.hostname,
                    challenge: getRandomBytes(32),
                    allowCredentials: credentialId
                        ? [{ type: 'public-key', id: credentialId }]
                        : [],
                    userVerification: 'preferred',
                    extensions: { prf: { eval: { first: PRF_SALT } } },
                },
            });

            if (!(assertion instanceof PublicKeyCredential)) {
                setOutput('No assertion was returned');

                return;
            }

            const prfOutput = assertion.getClientExtensionResults().prf?.results?.first;
            setOutput(
                [
                    `credential id: ${bytesToHex(new Uint8Array(assertion.rawId))}`,
                    `prf output: ${prfOutput instanceof ArrayBuffer ? bytesToHex(new Uint8Array(prfOutput)) : 'none'}`,
                ].join('\n'),
            );
        } catch (error) {
            setOutput(`get failed: ${describeError(error)}`);
        } finally {
            setIsPending(false);
        }
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
                        <Button onClick={getAssertion} isLoading={isPending} isDisabled={isPending}>
                            Get assertion with PRF
                        </Button>
                    </ButtonGroup>
                </Column>
            </SectionItem>
        </SettingsSection>
    );
};
