import React, { useState } from 'react';
import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import { Button } from '@trezor/components';

import * as metadataUtils from 'src/utils/suite/metadata';
import type { PasswordEntry as PasswordEntryType } from 'src/types/suite/metadata';

const PasswordEntryRow = styled.div`
    margin-bottom: 4px;
`;

const PasswordEntryBody = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    margin-left: 8px;
`;

const PasswordEntryTitle = styled.div`
    font-size: 14px;
`;

const PasswordEntryUsername = styled.div`
    font-size: 14px;
`;

const PasswordEntryPassword = styled.div`
    font-size: 14px;
`;

const HD_HARDENED = 0x80000000;
const PATH = [10016 + HD_HARDENED, 0];

interface PasswordEntryProps extends PasswordEntryType {
    devicePath: string;
}

const getDisplayKey = (title: string, username: string) =>
    // todo: implement this for the other category too: https://github.com/trezor/trezor-password-manager/blob/6266f685226bc5d5e0d8c7f08490b282f64ad1d1/source/background/classes/trezor_mgmt.js#L389-L390
    `Unlock ${title} for user ${username}?`;

export const PasswordEntry = ({
    username,
    title,
    nonce,
    password,
    devicePath,
}: PasswordEntryProps) => {
    const [decodedPassword, setDecodedPassword] = useState('');
    const [inProgress, setInProgress] = useState(false);

    const decode = () => {
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
                    const decrypted = metadataUtils.decrypt(
                        Buffer.from(password.data),
                        Buffer.from(result.payload.value, 'hex'),
                    );
                    setDecodedPassword(decrypted);
                }
            })
            .finally(() => {
                setInProgress(false);
            });
    };

    return (
        <>
            <PasswordEntryRow>
                <PasswordEntryBody>
                    <PasswordEntryTitle>{title}</PasswordEntryTitle>
                    <PasswordEntryUsername>{username}</PasswordEntryUsername>
                    <PasswordEntryPassword>
                        {!decodedPassword ? (
                            <Button onClick={decode} type="button" variant="tertiary">
                                {inProgress ? '....' : 'decode'}
                            </Button>
                        ) : (
                            decodedPassword
                        )}
                    </PasswordEntryPassword>
                </PasswordEntryBody>
            </PasswordEntryRow>
        </>
    );
};
