import { cloneObject } from '@trezor/utils';

import { METADATA } from 'src/actions/suite/constants';
import { Dispatch, GetState } from 'src/types/suite';
import { ProviderErrorAction, PasswordEntry, PasswordManagerState } from 'src/types/suite/metadata';
import * as metadataUtils from 'src/utils/suite/metadata';
import { selectSelectedProviderForPasswords } from 'src/reducers/suite/metadataReducer';

import * as metadataActions from './metadataActions';

export const fetchPasswords =
    (fileName: string, key: Buffer) => async (dispatch: Dispatch, _getState: GetState) => {
        const provider = dispatch(
            metadataActions.getProviderInstance({
                clientId: METADATA.DROPBOX_PASSWORDS_CLIENT_ID,
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
                metadataActions.handleProviderError({
                    error: response,
                    action: ProviderErrorAction.LOAD,
                    clientId: provider.clientId,
                }),
            );
        }

        return new Promise<void>((resolve, reject) =>
            provider.getFileContent(fileName).then(result => {
                if (!result.success) {
                    return reject(result);
                }

                if (result.payload) {
                    try {
                        const decrypted = metadataUtils.decrypt(
                            metadataUtils.arrayBufferToBuffer(result.payload),
                            key,
                        );

                        dispatch({
                            type: METADATA.SET_DATA,
                            payload: {
                                provider,
                                data: {
                                    [fileName]: decrypted,
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

export const addPasswordMetadata =
    (payload: PasswordEntry, fileName: string, aesKey: string) =>
    (dispatch: Dispatch, getState: GetState) => {
        // const device = selectDevice(getState());
        const provider = selectSelectedProviderForPasswords(getState());

        if (!provider)
            return Promise.resolve({
                success: false,
                error: 'provider missing',
            });

        // todo: duplicated,
        const DEFAULT_PASSWORD_MANAGER_STATE: PasswordManagerState = {
            extVersion: '1',
            config: {
                orderType: 'date',
            },
            entries: {},
            tags: {
                0: {
                    title: 'All',
                    icon: 'todo',
                },
            },
        };

        const metadata = cloneObject(provider.data[fileName]) || DEFAULT_PASSWORD_MANAGER_STATE;

        if ('extVersion' in metadata) {
            console.log('metadata meow', metadata);
            const nextId = Object.keys(metadata.entries).length + 1;
            metadata.entries[Object.keys(metadata.entries).length + 1] = payload;

            dispatch(
                metadataActions.setMetadata({
                    provider,
                    fileName,
                    data: metadata,
                }),
            );

            return dispatch(
                metadataActions.encryptAndSaveMetadata({
                    provider,
                    fileName,
                    data: metadata,
                    aesKey,
                }),
            );
        } else {
            return Promise.resolve({ success: false, error: 'trying to edit wrong object' });
        }
    };
