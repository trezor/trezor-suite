import React, { useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import type { PasswordEntry as PasswordEntryType } from '@suite-common/metadata-types';
import { Button, Column, H3, Modal, Paragraph } from '@trezor/components';
import TrezorConnect, { DeviceUniquePath } from '@trezor/connect';
import { spacings, spacingsPx } from '@trezor/theme';

import { EntryForm } from './EntryForm';
import { getDisplayKey } from './passwords';
import { usePasswords } from './usePasswords';
import { PATH } from '../metadataPasswordsConstants';
import * as metadataUtils from '../metadataUtils';

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
            device: { path: devicePath, useEmptyPassphrase: true },
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
                <Modal
                    intent="critical"
                    iconName="trash"
                    bottomContent={
                        <>
                            <Modal.Button
                                onClick={() => {
                                    removePassword(index);
                                    setFormActive(null);
                                    setConfirmRemove(null);
                                }}
                            >
                                <Translation id="TR_CONFIRM" />
                            </Modal.Button>
                            <Modal.Button
                                onClick={() => setConfirmRemove(null)}
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id="TR_CANCEL" />
                            </Modal.Button>
                        </>
                    }
                >
                    <Column gap={spacings.xs}>
                        <H3>Remove password entry</H3>
                        <Paragraph>{`Really remove ${note || title}?`}</Paragraph>
                    </Column>
                </Modal>
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
                        <Button
                            size="small"
                            onClick={decrypt}
                            type="button"
                            intent="neutral"
                            priority="secondary"
                        >
                            {inProgress ? '....' : 'decrypt'}
                        </Button>
                    )}
                    {decryptedPassword !== null && (
                        <>
                            {formActive === index && (
                                <Row>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setConfirmRemove(index);
                                        }}
                                        type="button"
                                        intent="critical"
                                    >
                                        Remove
                                    </Button>
                                </Row>
                            )}
                            {formActive === null && (
                                <Row>
                                    <Button
                                        size="small"
                                        onClick={() => setFormActive(index)}
                                        type="button"
                                        intent="neutral"
                                        priority="secondary"
                                        iconLeft="pencil"
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
