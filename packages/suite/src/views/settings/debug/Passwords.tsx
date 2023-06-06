import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import crypto from 'crypto';
import { Button } from '@trezor/components';

import { SectionItem } from '@suite-components/Settings';
import { useSelector, useActions } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import * as metadataUtils from '@suite-utils/metadata';
import type { PasswordEntry } from '@suite-types/metadata';
import { METADATA } from '@suite-actions/constants';

const PasswordsList = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
`;

const PasswordEntryRow = styled.div<{ clickable: boolean }>`
    display: flex;
    flex-direction: row;
    margin-bottom: 4px;
    cursor: ${({ clickable }) => (clickable ? '' : 'pointer')};
`;

const PasswordEntryBody = styled.div`
    dipslay: flex;
    flex-direction: column;
    margin-left: 8px;
`;

const PasswordEntryIcon = styled.div`
    width: 40px;
    height: 40px;
    background-color: yellow;
`;

const PasswordEntryTitle = styled.div`
    font-size: 16px;
`;

const PasswordEntryUsername = styled.div`
    font-size: 12px;
`;

const PasswordEntryPassword = styled.div`
    font-size: 12px;
`;

interface PasswordEntryProps extends PasswordEntry {
    devicePath: string;
}

const getDisplayKey = (title: string, username: string) => {
    // title = this.bgStore.isUrl(title) ? this.bgStore.decomposeUrl(title).domain : title;
    return 'Unlock ' + title + ' for user ' + username + '?';
};

const PasswordEntryComponent = ({
    username,
    title,
    nonce,
    password,

    devicePath,
}: PasswordEntryProps) => {
    const [decodedPassword, setDecodedPassword] = useState('');
    const [inProgress, setInProgress] = useState(false);

    const decode = useCallback(() => {
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
                console.log(result);
                if (result.success) {
                    console.log('password', password);
                    const decrypted = metadataUtils.decrypt(
                        new Buffer(password.data),
                        new Buffer(result.payload.value, 'hex'),
                    );
                    console.log('decrypted', decrypted);
                    setDecodedPassword(decrypted);
                }
            })
            .finally(() => {
                setInProgress(false);
            });
    }, [username, title, inProgress]);

    return (
        <PasswordEntryRow onClick={decode} clickable={!inProgress && !decodedPassword}>
            <PasswordEntryIcon />
            <PasswordEntryBody>
                <PasswordEntryTitle>{title}</PasswordEntryTitle>
                <PasswordEntryUsername>{username}</PasswordEntryUsername>
                {inProgress ? (
                    '...'
                ) : (
                    <PasswordEntryPassword>
                        {!decodedPassword ? '*****' : decodedPassword}
                    </PasswordEntryPassword>
                )}
            </PasswordEntryBody>
        </PasswordEntryRow>
    );
};

const FILENAME_MESS = '5f91add3fa1c3c76e90c90a3bd0999e2bd7833d06a483fe884ee60397aca277a';
const HD_HARDENED = 0x80000000;
const PATH = [(10016 | HD_HARDENED) >>> 0, 0];
const DEFAULT_KEYPHRASE = 'Activate TREZOR Password Manager?';
const DEFAULT_NONCE =
    '2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee';

export const PasswordManager = () => {
    const [fileName, setFileName] = useState('');
    const [providerConnected, setProviderConnected] = useState(false);
    const [providerConnecting, setProviderConnecting] = useState(false);

    const { device, metadata } = useSelector(state => ({
        metadata: state.metadata,
        device: state.suite.device,
    }));

    const { fetchPasswords, connectProvider, disconnectProvider } = useActions({
        connectProvider: metadataActions.connectProvider,
        disconnectProvider: metadataActions.disconnectProvider,
        fetchPasswords: metadataActions.fetchPasswords,
    });

    const selectedProvider = metadata.providers.find(
        p => p.clientId === METADATA.DROPBOX_PASSWODS_CLIENT_ID,
    );

    const passwordEntries: PasswordEntry[] = useMemo(() => {
        if (!fileName || !selectedProvider || !selectedProvider?.data?.[fileName]) {
            return [];
        }

        const data = selectedProvider?.data![fileName];
        if ('entries' in data) {
            return data.entries;
        }
        return [];
    }, [metadata]);
    console.log('passwordEntries', passwordEntries);

    const connect = useCallback(async () => {
        setProviderConnecting(true);
        setProviderConnected(false);

        await disconnectProvider();
        connectProvider({ type: 'dropbox', clientId: METADATA.DROPBOX_PASSWODS_CLIENT_ID })
            .then(() => {
                setProviderConnected(true);
            })
            .finally(() => {
                setProviderConnecting(false);
            });
    }, []);

    useEffect(() => {
        if (providerConnected) {
            TrezorConnect.cipherKeyValue({
                device: { path: device?.path },
                override: true,
                useEmptyPassphrase: true,
                path: PATH,
                key: DEFAULT_KEYPHRASE,
                value: DEFAULT_NONCE,
                encrypt: true,
                askOnEncrypt: true,
                askOnDecrypt: true,
            }).then(res => {
                if (res.success) {
                    const encryptionKey = new Buffer(
                        res.payload.value.substring(
                            res.payload.value.length / 2,
                            res.payload.value.length,
                        ),
                        'hex',
                    );

                    let fileKey = res.payload.value.substring(0, res.payload.value.length / 2);
                    const fname =
                        crypto.createHmac('sha256', fileKey).update(FILENAME_MESS).digest('hex') +
                        '.pswd';
                    setFileName(fname);
                    fetchPasswords(device?.state!, fname, encryptionKey);
                }
            });
        }
    }, [providerConnected]);

    if (providerConnecting) {
        return <SectionItem>Connecting...</SectionItem>;
    }

    if (!providerConnected) {
        return (
            <SectionItem>
                <Button onClick={connect}>Connect to dropbox</Button>
            </SectionItem>
        );
    }

    return (
        <>
            <SectionItem>
                <div>
                    <div>provider type: {selectedProvider?.type}</div>
                    <div>provider clientId: {selectedProvider?.clientId}</div>
                    <div>provider user: {selectedProvider?.user}</div>
                </div>
            </SectionItem>
            <SectionItem>
                <PasswordsList>
                    {Object.entries(passwordEntries).map(([key, entry]) => (
                        <PasswordEntryComponent {...entry} devicePath={device!.path} key={key} />
                    ))}
                </PasswordsList>
            </SectionItem>
        </>
    );
};
