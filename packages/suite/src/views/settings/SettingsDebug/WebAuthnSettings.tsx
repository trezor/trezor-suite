import { useState } from 'react';

import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { initIDB } from 'idb-stores';
import z from 'zod';

import { Button, Column, Icon, Switch, Textarea, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import {
    decryptWithWebAuthn,
    disableBiometricAuthentication,
    disableEncryptedStorage,
    enableBiometricAuthentication,
    enableEncryptedStorage,
    encryptWithWebAuthn,
    isBiometricAuthenticationEnabled,
    isEncryptedStorageEnabled,
    isWebAuthnFullySupported,
    retrieveEncryptionKeyAndSalt,
} from 'src/modules/webauthn';

const encryptedStorageDB = initIDB({
    database: {
        name: 'encryptedStorage',
        version: 1,
    },
    storeSchemas: {
        store: z.object({
            value: z.string().optional().default(''),
            nonce: z.string().nullish().default(null),
        }),
    },
});

function EncryptedStorage() {
    const [value, setValue] = useState<string>('');

    const retreiveValue = useQuery({
        queryKey: ['store'],
        queryFn: async () => {
            const value = await encryptedStorageDB('store').get('value');
            const nonce = await encryptedStorageDB('store').get('nonce');

            if ((await isEncryptedStorageEnabled()) && nonce && value) {
                const plaintext = await decryptWithWebAuthn(hexToBytes(value), hexToBytes(nonce));
                setValue(new TextDecoder().decode(plaintext));
            } else {
                setValue(value);
            }

            return null;
        },
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const save = useMutation({
        mutationFn: async (value: string) => {
            if (await isEncryptedStorageEnabled()) {
                const { nonce, ciphertext } = await encryptWithWebAuthn(
                    new TextEncoder().encode(value),
                );

                await encryptedStorageDB('store').set('nonce', bytesToHex(nonce));
                await encryptedStorageDB('store').set('value', bytesToHex(ciphertext));
            } else {
                await encryptedStorageDB('store').set('value', value);
            }
        },
    });

    return (
        <Column gap={spacings.md}>
            <Textarea
                label="Encrypted storage"
                value={value}
                onChange={e => setValue(e.target.value)}
                rows={10}
            />
            <Button
                isDisabled={retreiveValue.isLoading}
                isLoading={save.isPending}
                onClick={() => {
                    save.mutate(value);
                }}
            >
                Save
            </Button>
        </Column>
    );
}

export const WebAuthnSettings = () => {
    const [isSecureStorageEnabled, setIsSecureStorageEnabled] = useState(false);
    const [isBioAuthEnabled, setIsBioAuthEnabled] = useState(false);

    const enableSecureStorageMutation = useMutation({
        mutationFn: enableEncryptedStorage,
        onError: () => {
            setIsSecureStorageEnabled(false);
        },
    });
    const disableSecureStorageMutation = useMutation({
        mutationFn: disableEncryptedStorage,
        onError: () => {
            setIsSecureStorageEnabled(false);
        },
    });

    const enableBiometricAuthenticationMutation = useMutation({
        mutationFn: enableBiometricAuthentication,
        onError: () => {
            setIsBioAuthEnabled(false);
        },
    });
    const disableBiometricAuthenticationMutation = useMutation({
        mutationFn: disableBiometricAuthentication,
        onError: () => {
            setIsBioAuthEnabled(true);
        },
    });

    const webauthnQuery = useQuery({
        queryKey: ['webauthn'],
        async queryFn() {
            const supported = await isWebAuthnFullySupported();
            let biometricAuthenticationEnabled = await isBiometricAuthenticationEnabled();
            let encryptedStorageEnabled = await isEncryptedStorageEnabled();

            console.log('Loading WebAuthn settings', {
                biometricAuthenticationEnabled,
                encryptedStorageEnabled,
            });

            if (biometricAuthenticationEnabled) {
                try {
                    await retrieveEncryptionKeyAndSalt();
                } catch (error) {
                    console.error(error);

                    await disableSecureStorageMutation.mutateAsync();
                    await disableBiometricAuthenticationMutation.mutateAsync();
                    await encryptedStorageDB('store').clear();

                    biometricAuthenticationEnabled = false;
                    encryptedStorageEnabled = false;
                }
            }

            setIsBioAuthEnabled(biometricAuthenticationEnabled);
            setIsSecureStorageEnabled(encryptedStorageEnabled);

            return {
                supported,
                biometricAuthenticationEnabled,
                encryptedStorageEnabled,
            };
        },
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    return (
        <SettingsSection title="WebAuthn">
            <SectionItem>
                <TextColumn
                    title="Biometric authentication"
                    description="Use Touch ID or Windows Hello authentication to access Trezor Suite."
                />
                <ActionColumn>
                    {webauthnQuery.data?.supported === false ? (
                        <Tooltip content="WebAuthn is not supported on this device.">
                            <Icon name="warning" variant="warning" size={32} />
                        </Tooltip>
                    ) : (
                        <Switch
                            isChecked={isBioAuthEnabled}
                            isDisabled={webauthnQuery.isLoading || !webauthnQuery.data?.supported}
                            // TODO: move it to new mutation (catch error & follow the state)
                            onChange={async () => {
                                const isEnabled = !isBioAuthEnabled;

                                setIsBioAuthEnabled(isEnabled);

                                if (isEnabled) {
                                    await enableBiometricAuthenticationMutation.mutateAsync();
                                } else {
                                    setIsSecureStorageEnabled(false);
                                    await disableSecureStorageMutation.mutateAsync();
                                    await encryptedStorageDB('store').clear();
                                    await disableBiometricAuthenticationMutation.mutateAsync();
                                }
                            }}
                        />
                    )}
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn
                    title="Secure storage"
                    description="Encrypt data stored in IndexedDB using WebAuthn."
                />
                <ActionColumn>
                    {webauthnQuery.data?.supported === false && (
                        <Tooltip content="WebAuthn is not supported on this device.">
                            <Icon name="warning" variant="warning" size={32} />
                        </Tooltip>
                    )}

                    {webauthnQuery.data?.biometricAuthenticationEnabled === false &&
                        !isBioAuthEnabled && (
                            <Tooltip content="Enable biometric authentication to use secure storage.">
                                <Icon name="warning" variant="warning" size={32} />
                            </Tooltip>
                        )}

                    {webauthnQuery.data?.supported && isBioAuthEnabled && (
                        <>
                            <Switch
                                isChecked={isSecureStorageEnabled}
                                isDisabled={
                                    webauthnQuery.isLoading || !webauthnQuery.data?.supported
                                }
                                // TODO: move it to new mutation (catch error & follow the state)
                                onChange={async () => {
                                    const isEnabled = !isSecureStorageEnabled;

                                    setIsSecureStorageEnabled(isEnabled);

                                    if (isEnabled) {
                                        await enableSecureStorageMutation.mutateAsync();
                                    } else {
                                        await disableSecureStorageMutation.mutateAsync();
                                        await encryptedStorageDB('store').clear();
                                    }
                                }}
                            />
                        </>
                    )}
                </ActionColumn>
            </SectionItem>

            {!webauthnQuery.isLoading &&
                !enableSecureStorageMutation.isPending &&
                isSecureStorageEnabled && <EncryptedStorage />}
        </SettingsSection>
    );
};
