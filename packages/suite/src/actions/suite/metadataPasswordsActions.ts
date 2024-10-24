import crypto from 'crypto';

import TrezorConnect from '@trezor/connect';
import { cloneObject } from '@trezor/utils';
import { selectDevice } from '@suite-common/wallet-core';

import { METADATA, METADATA_PROVIDER, METADATA_PASSWORDS } from 'src/actions/suite/constants';
import { Dispatch, GetState } from 'src/types/suite';
import { ProviderErrorAction, PasswordEntry, LabelableEntityKeys } from 'src/types/suite/metadata';
import * as metadataUtils from 'src/utils/suite/metadata';
import { selectSelectedProviderForPasswords } from 'src/reducers/suite/metadataReducer';

import * as metadataActions from './metadataActions';
import * as metadataProviderActions from './metadataProviderActions';

import type { FetchIntervalTrackingId } from './metadataProviderActions';

export const fetchPasswords =
    (keys: LabelableEntityKeys) => async (dispatch: Dispatch, _getState: GetState) => {
        const provider = dispatch(
            metadataProviderActions.getProviderInstance({
                clientId: METADATA_PROVIDER.DROPBOX_PASSWORDS_CLIENT_ID,
                dataType: 'passwords',
            }),
        );
        if (!provider) {
            return;
        }

        // this triggers renewal of access token if needed. Otherwise multiple requests
        // to renew access token are issued by every provider.getFileContent
        const response = await provider.getProviderDetails();
        if (!response.success) {
            return dispatch(
                metadataProviderActions.handleProviderError({
                    error: response,
                    action: ProviderErrorAction.LOAD,
                    clientId: provider.clientId,
                }),
            );
        }

        return new Promise<void>((resolve, reject) =>
            provider.getFileContent(keys.fileName).then(result => {
                if (!result.success) {
                    return reject(result);
                }

                if (result.payload) {
                    try {
                        const decrypted = metadataUtils.decrypt(
                            metadataUtils.arrayBufferToBuffer(result.payload),
                            keys.aesKey,
                        );

                        dispatch({
                            type: METADATA.SET_DATA,
                            payload: {
                                provider,
                                data: {
                                    [keys.fileName]: decrypted,
                                },
                            },
                        });
                    } catch (err) {
                        const error = provider.error('OTHER_ERROR', err.message);

                        return reject(error);
                    }
                }

                resolve();
            }),
        );
    };

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    let device = selectDevice(getState());

    if (!device?.state) {
        console.error('no device state!');

        return Promise.resolve();
    }

    dispatch({
        type: METADATA.SET_DEVICE_METADATA_PASSWORDS,
        payload: {
            deviceState: device.state,
            metadata: {
                ...device.passwords,
                [1]: {
                    fileName: '',
                    aesKey: '',
                    key: '',
                },
            },
        },
    });

    try {
        const res = await TrezorConnect.cipherKeyValue({
            device: { path: device?.path },
            override: true,
            useEmptyPassphrase: true,
            path: METADATA_PASSWORDS.PATH,
            key: METADATA_PASSWORDS.DEFAULT_KEYPHRASE,
            value: METADATA_PASSWORDS.DEFAULT_NONCE,
            encrypt: true,
            askOnEncrypt: true,
            askOnDecrypt: true,
        });
        if (!res.success) {
            throw new Error(res.payload.error);
        }
        const encryptionKey = res.payload.value.substring(
            res.payload.value.length / 2,
            res.payload.value.length,
        );

        const fileKey = res.payload.value.substring(0, res.payload.value.length / 2);
        const fname = `${crypto
            .createHmac('sha256', fileKey)
            .update(METADATA_PASSWORDS.FILENAME_MESS)
            .digest('hex')}.pswd`;

        dispatch({
            type: METADATA.SET_DEVICE_METADATA_PASSWORDS,
            payload: {
                deviceState: device.state,
                metadata: {
                    ...device.passwords,
                    [1]: {
                        fileName: fname,
                        aesKey: encryptionKey,
                        // todo: this is most likely not needed. only for sub-account keys derivations which
                        // is not present in passwords
                        key: '',
                    },
                },
            },
        });
        const selectedProvider = selectSelectedProviderForPasswords(getState());
        if (!selectedProvider) {
            await dispatch(
                metadataProviderActions.connectProvider({
                    type: 'dropbox',
                    dataType: 'passwords',
                    clientId: METADATA_PROVIDER.DROPBOX_PASSWORDS_CLIENT_ID,
                }),
            );
        }

        await dispatch(
            fetchPasswords({
                fileName: fname,
                aesKey: encryptionKey,
            }),
        );
    } catch (err) {
        console.error('cipherKeyValue error', err);
    }

    device = selectDevice(getState());
    const selectedProvider = selectSelectedProviderForPasswords(getState());
    if (!selectedProvider || !device?.state?.staticSessionId) {
        // ts, should not happen
        return;
    }
    const fetchIntervalTrackingId: FetchIntervalTrackingId = metadataUtils.getFetchTrackingId(
        'passwords',
        selectedProvider.clientId,
        device.state.staticSessionId,
    );

    if (device?.state && !metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
        metadataProviderActions.fetchIntervals[fetchIntervalTrackingId] = setInterval(() => {
            device = selectDevice(getState());
            const { fileName, aesKey } = device?.passwords?.[1] || {};

            if (!getState().suite.online || !device?.state || !fileName || !aesKey) {
                return;
            }
            dispatch(
                fetchPasswords({
                    fileName,
                    aesKey,
                }),
            );
        }, METADATA_PASSWORDS.FETCH_INTERVAL);
    }
};

export const addPasswordMetadata =
    (nextId: number, payload: PasswordEntry, fileName: string, aesKey: string) =>
    (dispatch: Dispatch, getState: GetState) => {
        if (!payload.note) {
            return Promise.resolve({ success: false, error: 'required field (note) missing' });
        }
        const provider = selectSelectedProviderForPasswords(getState());
        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstance({
                clientId: METADATA_PROVIDER.DROPBOX_PASSWORDS_CLIENT_ID,
                dataType: 'passwords',
            }),
        );

        if (!providerInstance || !provider)
            return Promise.resolve({
                success: false,
                error: 'provider missing',
            });

        const metadata =
            cloneObject(provider.data[fileName]) ||
            METADATA_PASSWORDS.DEFAULT_PASSWORD_MANAGER_STATE;

        if ('config' in metadata) {
            metadata.entries[nextId] = payload;

            dispatch(
                metadataActions.setMetadata({
                    provider,
                    fileName,
                    data: metadata,
                }),
            );

            metadataActions.encryptAndSaveMetadata({
                providerInstance,
                fileName,
                data: metadata,
                aesKey,
            });
        } else {
            return Promise.resolve({ success: false, error: 'trying to edit wrong object' });
        }
    };

export const removePasswordMetadata =
    (index: number, fileName: string, aesKey: string) =>
    (dispatch: Dispatch, getState: GetState) => {
        const provider = selectSelectedProviderForPasswords(getState());
        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstance({
                clientId: METADATA_PROVIDER.DROPBOX_PASSWORDS_CLIENT_ID,
                dataType: 'passwords',
            }),
        );

        if (!providerInstance || !provider)
            return Promise.resolve({
                success: false,
                error: 'provider missing',
            });

        const metadata = cloneObject(provider.data[fileName]);

        if (metadata && 'config' in metadata) {
            delete metadata.entries[index];

            dispatch(
                metadataActions.setMetadata({
                    provider,
                    fileName,
                    data: metadata,
                }),
            );

            metadataActions.encryptAndSaveMetadata({
                providerInstance,
                fileName,
                data: metadata,
                aesKey,
            });
        } else {
            return Promise.resolve({ success: false, error: 'trying to edit wrong object' });
        }
    };
