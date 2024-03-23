import React, { useState } from 'react';
import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import { Button } from '@trezor/components';

import * as metadataUtils from 'src/utils/suite/metadata';
import type { PasswordEntry as PasswordEntryType } from 'src/types/suite/metadata';
import { PATH } from 'src/actions/suite/constants/metadataPasswordsConstants';
import { getDisplayKey } from 'src/utils/suite/passwords';
import { usePasswords } from 'src/hooks/suite';
import { EntryForm } from './EntryForm';

export const PasswordEntryRow = styled.div`
    margin-bottom: 4px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    margin-left: 8px;
`;

export const PasswordEntryCol = styled.div`
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    gap: 4px;
`;

interface PasswordEntryProps extends PasswordEntryType {
    devicePath: string;
    onEncrypted: (entry: PasswordEntryType) => void;
    formActive: undefined | number;
    setFormActive: (id?: number) => void;
    index: number;
}

export const PasswordEntry = ({
    username,
    title,
    nonce,
    note,
    password,
    safe_note,
    devicePath,
    onEncrypted,
    formActive,
    setFormActive,
    index,
}: PasswordEntryProps) => {
    const [decryptedPassword, setDecryptedPassword] = useState('');
    const [decryptedSafeNote, setDecryptedSafeNote] = useState('');
    const [inProgress, setInProgress] = useState(false);
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
                    const decryptedPassword = metadataUtils.decrypt(
                        Buffer.from(password.data),
                        decryptionKey,
                    );

                    setDecryptedPassword(decryptedPassword);

                    if (safe_note) {
                        const decryptedSafeNote = metadataUtils.decrypt(
                            Buffer.from(safe_note.data),
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
            <PasswordEntryRow>
                <PasswordEntryCol>{note || title}</PasswordEntryCol>

                <PasswordEntryCol>{username}</PasswordEntryCol>
                <PasswordEntryCol>{decryptedSafeNote}</PasswordEntryCol>
                <PasswordEntryCol>{decryptedPassword}</PasswordEntryCol>
                <PasswordEntryCol>
                    {!decryptedPassword ? (
                        <Button size="tiny" onClick={decrypt} type="button" variant="tertiary">
                            {inProgress ? '....' : 'decrypt'}
                        </Button>
                    ) : formActive === index ? (
                        <Row>
                            <Button
                                size="tiny"
                                onClick={() => removePassword(index)}
                                type="button"
                                variant="destructive"
                                icon="CROSS"
                            >
                                Remove
                            </Button>
                        </Row>
                    ) : (
                        <Row>
                            <Button
                                size="tiny"
                                onClick={() => setFormActive(index)}
                                type="button"
                                variant="tertiary"
                                icon="PENCIL"
                            >
                                Edit
                            </Button>
                        </Row>
                    )}
                </PasswordEntryCol>
            </PasswordEntryRow>
            {formActive === index && (
                <EntryForm
                    cancel={() => setFormActive(undefined)}
                    onEncrypted={args => {
                        onEncrypted(args);
                        setDecryptedPassword('');
                        setDecryptedSafeNote('');
                    }}
                    entry={{
                        title,
                        username,
                        password: decryptedPassword,
                        note: decryptedSafeNote,
                        tags: [],
                        safe_note: decryptedSafeNote,
                    }}
                />
            )}
        </>
    );
};
