import React, { useState } from 'react';
import styled from 'styled-components';
import TrezorConnect, { DeviceUniquePath } from '@trezor/connect';
import { Button } from '@trezor/components';

import { spacingsPx } from '@trezor/theme';

import { DialogModal } from 'src/components/suite/modals/Modal/DialogRenderer';
import * as metadataUtils from 'src/utils/suite/metadata';
import type { PasswordEntry as PasswordEntryType } from 'src/types/suite/metadata';
import { PATH } from 'src/actions/suite/constants/metadataPasswordsConstants';
import { getDisplayKey } from 'src/utils/suite/passwords';
import { usePasswords } from 'src/hooks/suite';

import { EntryForm } from './EntryForm';

export const PasswordEntryRow = styled.div`
    margin-bottom: ${spacingsPx.xxs};
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    margin-left: ${spacingsPx.xs};
`;

export const PasswordEntryCol = styled.div`
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${spacingsPx.xxs};
`;

interface PasswordEntryProps extends PasswordEntryType {
    devicePath: DeviceUniquePath;
    onEncrypted: (entry: PasswordEntryType) => void;
    formActive: number | null;
    setFormActive: (id: number | null) => void;
    index: number;
}

export const PasswordEntry = ({
    username,
    title,
    nonce,
    note,
    password,
    safe_note,
    tags,
    devicePath,
    onEncrypted,
    formActive,
    setFormActive,
    index,
}: PasswordEntryProps) => {
    const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
    const [decryptedSafeNote, setDecryptedSafeNote] = useState<string | null>(null);
    const [inProgress, setInProgress] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

    const decrypt = () => {
        if (inProgress) return;
        setInProgress(true);
        TrezorConnect.cipherKeyValue({
            device: { path: devicePath },
            override: true,
            useEmptyPassphrase: true,
            path: PATH,
            key: getDisplayKey(title, username),
            value: nonce,
            encrypt: false,
            askOnEncrypt: false,
            askOnDecrypt: true,
        })
            .then(result => {
                if (result.success) {
                    const decryptionKey = Buffer.from(result.payload.value, 'hex');

                    if (password) {
                        const decryptedPassword = metadataUtils.decrypt(
                            Buffer.from(password),
                            decryptionKey,
                        );
                        setDecryptedPassword(decryptedPassword);
                    }

                    if (safe_note) {
                        const decryptedSafeNote = metadataUtils.decrypt(
                            Buffer.from(safe_note),
                            decryptionKey,
                        );
                        setDecryptedSafeNote(decryptedSafeNote);
                    }
                }
            })
            .finally(() => {
                setInProgress(false);
            });
    };

    const { removePassword } = usePasswords();

    return (
        <>
            {confirmRemove != null && (
                <DialogModal
                    bodyHeading="Remove password entry"
                    body={`Really remove ${note || title}?`}
                    bottomBarComponents={
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    removePassword(index);
                                    setFormActive(null);
                                    setConfirmRemove(null);
                                }}
                            >
                                Confirm
                            </Button>
                            <Button onClick={() => setConfirmRemove(null)} type="button">
                                Nope
                            </Button>
                        </>
                    }
                />
            )}
            <PasswordEntryRow>
                <PasswordEntryCol>{note || title}</PasswordEntryCol>

                <PasswordEntryCol>{username}</PasswordEntryCol>
                <PasswordEntryCol>
                    {decryptedSafeNote === null ? '*****' : decryptedSafeNote}
                </PasswordEntryCol>
                <PasswordEntryCol>
                    {decryptedPassword === null ? '*****' : decryptedPassword}
                </PasswordEntryCol>
                <PasswordEntryCol>
                    {decryptedPassword === null && (
                        <Button size="tiny" onClick={decrypt} type="button" variant="tertiary">
                            {inProgress ? '....' : 'decrypt'}
                        </Button>
                    )}
                    {decryptedPassword !== null && (
                        <>
                            {formActive === index && (
                                <Row>
                                    <Button
                                        size="tiny"
                                        onClick={() => {
                                            setConfirmRemove(index);
                                        }}
                                        type="button"
                                        variant="destructive"
                                    >
                                        Remove
                                    </Button>
                                </Row>
                            )}
                            {formActive === null && (
                                <Row>
                                    <Button
                                        size="tiny"
                                        onClick={() => setFormActive(index)}
                                        type="button"
                                        variant="tertiary"
                                        icon="pencil"
                                    >
                                        Edit
                                    </Button>
                                </Row>
                            )}
                        </>
                    )}
                </PasswordEntryCol>
            </PasswordEntryRow>
            {formActive === index && (
                <EntryForm
                    cancel={() => setFormActive(null)}
                    onEncrypted={args => {
                        onEncrypted(args);
                        setDecryptedPassword(null);
                        setDecryptedSafeNote(null);
                    }}
                    entry={{
                        note: note || '',
                        title,
                        username,
                        password: decryptedPassword || '',
                        safe_note: decryptedSafeNote || '',
                        tags,
                    }}
                />
            )}
        </>
    );
};
