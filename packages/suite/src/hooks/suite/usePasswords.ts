import { useState } from 'react';
import crypto from 'crypto';

import TrezorConnect from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';

import { useSelector, useDispatch } from 'src/hooks/suite';
import * as metadataProviderActions from 'src/actions/suite/metadataProviderActions';
import * as metadataPasswordsActions from 'src/actions/suite/metadataPasswordsActions';
import type { PasswordManagerState } from 'src/types/suite/metadata';
import { METADATA } from 'src/actions/suite/constants';
import {
    selectPasswordManagerState,
    selectSelectedProviderForPasswords,
} from 'src/reducers/suite/metadataReducer';

const FILENAME_MESS = '5f91add3fa1c3c76e90c90a3bd0999e2bd7833d06a483fe884ee60397aca277a';
const HD_HARDENED = 0x80000000;
const PATH = [10016 + HD_HARDENED, 0];
const DEFAULT_KEYPHRASE = 'Activate TREZOR Password Manager?';
const DEFAULT_NONCE =
    '2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee';
const DEFAULT_PASSWORD_MANAGER_STATE: PasswordManagerState = {
    config: {
        orderType: 'date',
    },
    entries: {},
    extVersion: '',
    tags: {},
};

export const usePasswords = () => {
    // todo: filename is saved only locally. for production grade state of this feature we will of course need to save it into app state.

    const [fileName, setFileName] = useState('');
    const [providerConnecting, setProviderConnecting] = useState(false);
    const [fetchingPasswords, setFetchingPasswords] = useState(false);
    const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>({});
    const device = useSelector(selectDevice);
    const selectedProvider = useSelector(selectSelectedProviderForPasswords);

    const dispatch = useDispatch();

    const { entries, tags, extVersion } =
        useSelector(state => selectPasswordManagerState(state, fileName)) ||
        DEFAULT_PASSWORD_MANAGER_STATE;

    const connect = () => {
        setFileName('');
        setProviderConnecting(true);
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
        })
            .then(async res => {
                if (!res.success) {
                    throw new Error(res.payload.error);
                }
                const encryptionKey = Buffer.from(
                    res.payload.value.substring(
                        res.payload.value.length / 2,
                        res.payload.value.length,
                    ),
                    'hex',
                );

                const fileKey = res.payload.value.substring(0, res.payload.value.length / 2);
                const fname = `${crypto
                    .createHmac('sha256', fileKey)
                    .update(FILENAME_MESS)
                    .digest('hex')}.pswd`;

                setFileName(fname);

                if (!selectedProvider) {
                    await dispatch(
                        metadataProviderActions.connectProvider({
                            type: 'dropbox',
                            dataType: 'passwords',
                            clientId: METADATA.DROPBOX_PASSWORDS_CLIENT_ID,
                        }),
                    );
                }

                setFetchingPasswords(true);
                await dispatch(metadataPasswordsActions.fetchPasswords(fname, encryptionKey));
                setFetchingPasswords(false);
            })
            .finally(() => {
                setProviderConnecting(false);
            });
    };

    const disconnect = () => {
        if (!selectedProvider) return;
        dispatch(
            metadataProviderActions.disconnectProvider({
                clientId: selectedProvider.clientId,
                dataType: 'passwords',
                removeMetadata: false,
            }),
        );
    };

    const entriesByTag = Object.values(entries).filter(value =>
        value.tags.some(tag => selectedTags[tag]),
    );

    const isSomeTagSelected = Object.values(selectedTags).some(v => v);
    const isAllTagSelected = selectedTags['0'];

    return {
        entries,
        entriesByTag,
        tags,
        isSomeTagSelected,
        isAllTagSelected,
        extVersion,
        fileName,
        fetchingPasswords,
        selectedTags,
        setSelectedTags,
        connect,
        disconnect,
        device,
        selectedProvider,
        providerConnecting,
    };
};
