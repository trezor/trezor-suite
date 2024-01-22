import { METADATA } from 'src/actions/suite/constants';
import { Dispatch, GetState } from 'src/types/suite';
import { ProviderErrorAction } from 'src/types/suite/metadata';
import * as metadataUtils from 'src/utils/suite/metadata';

import * as metadataProviderActions from './metadataProviderActions';

export const fetchPasswords =
    (fileName: string, key: Buffer) => async (dispatch: Dispatch, _getState: GetState) => {
        const provider = dispatch(
            metadataProviderActions.getProviderInstance({
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
                metadataProviderActions.handleProviderError({
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
