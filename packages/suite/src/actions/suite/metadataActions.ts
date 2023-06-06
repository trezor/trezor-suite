import TrezorConnect from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';

import { createDeferred } from '@trezor/utils';
import { METADATA } from '@suite-actions/constants';
import { Dispatch, GetState } from '@suite-types';
import {
    MetadataProviderType,
    MetadataProvider,
    MetadataAddPayload,
    Tokens,
    DeviceMetadata,
    Error as MetadataProviderError,
    OAuthServerEnvironment,
    ProviderErrorAction,
    Labels,
    DataType,
} from '@suite-types/metadata';
import { Account } from '@wallet-types';
import * as metadataUtils from '@suite-utils/metadata';
import * as modalActions from '@suite-actions/modalActions';
import DropboxProvider from '@suite-services/metadata/DropboxProvider';
import GoogleProvider from '@suite-services/metadata/GoogleProvider';
import FileSystemProvider from '@suite-services/metadata/FileSystemProvider';
import { createAction } from '@reduxjs/toolkit';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedProviderForLabels } from '@suite-reducers/metadataReducer';

export const setAccountLoaded = createAction(METADATA.ACCOUNT_LOADED, (payload: Account) => ({
    payload,
}));

export const setAccountAdd = createAction(METADATA.ACCOUNT_ADD, (payload: Account) => ({
    payload,
}));

export type MetadataAction =
    | { type: typeof METADATA.ENABLE }
    | { type: typeof METADATA.DISABLE }
    | { type: typeof METADATA.SET_EDITING; payload: string | undefined }
    | { type: typeof METADATA.SET_INITIATING; payload: boolean }
    | {
          type: typeof METADATA.SET_DEVICE_METADATA;
          payload: { deviceState: string; metadata: DeviceMetadata };
      }
    | {
          type: typeof METADATA.SET_PROVIDER;
          payload: MetadataProviderType | undefined;
      }
    | {
          type: typeof METADATA.ADD_PROVIDER;
          payload: MetadataProvider;
      }
    | {
          type: typeof METADATA.WALLET_LOADED | typeof METADATA.WALLET_ADD;
          payload: { deviceState: string; walletLabel?: string };
      }
    | {
          type: typeof METADATA.SET_DATA;
          payload: {
              provider: MetadataProvider;
              data: Record<string, Passwords | Labels>;
          };
      }
    | {
          type: typeof METADATA.SET_SELECTED_PROVIDER;
          payload: {
              dataType: DataType;
              clientId: string;
          };
      }
    | ReturnType<typeof setAccountLoaded>
    | ReturnType<typeof setAccountAdd>;

// needs to be declared here in top level context because it's not recommended to keep classes instances in redux state (serialization)
let providerInstance: DropboxProvider | GoogleProvider | FileSystemProvider | undefined;
const fetchIntervals: { [deviceState: string]: any } = {}; // any because of native at the moment, otherwise number | undefined

const createProviderInstance = (
    type: MetadataProvider['type'],
    tokens: Tokens = {},
    environment: OAuthServerEnvironment = 'production',
) => {
    switch (type) {
        case 'dropbox':
            return new DropboxProvider({ token: tokens?.refreshToken, clientId });
        case 'google':
            return new GoogleProvider(tokens, environment);
        case 'fileSystem':
            return new FileSystemProvider();
        default:
            throw new Error(`provider of type ${type} is not implemented`);
    }
};

/**
 * dispose metadata from all labelable objects.
 * Has keys parameter,
 * if true - dispose also metadata keys
 * if false - dispose only metadata values
 */
export const disposeMetadata = (keys?: boolean) => (dispatch: Dispatch, getState: GetState) => {
    getState().wallet.accounts.forEach(account => {
        const updatedMetadata = {
            ...account.metadata,
        };

        // todo: remove addressLabels, outputLabels, from metadata reducer

        // and sometimes remove also keys (information we can only if device is connected)
        if (keys) {
            updatedMetadata.fileName = '';
            updatedMetadata.aesKey = '';
        }

        dispatch(
            setAccountAdd({
                ...account,
                metadata: updatedMetadata,
            }),
        );
    });

    getState().devices.forEach(device => {
        if (device.state) {
            let updatedMetadata = { ...device.metadata };

            if (keys) {
                // set metadata as disabled for this device, remove all metadata related information
                updatedMetadata = { status: 'disabled' };
            } else if ('key' in updatedMetadata) {
                // metadata is still enabled for this device, keys are kept, we are only removing walletLabel here
                updatedMetadata.walletLabel = '';
            }

            dispatch({
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: device.state,
                    metadata: updatedMetadata,
                },
            });
        }
    });
};

export const disconnectProvider =
    (removeMetadata = true) =>
    async (dispatch: Dispatch) => {
        Object.values(fetchIntervals).forEach((deviceState, num) => {
            clearInterval(num);
            delete fetchIntervals[deviceState];
        });

        /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
        const provider = dispatch(getProviderInstance({}));
        if (provider) {
            await provider.disconnect();
            providerInstance = undefined;
        }
        // flush reducer
        dispatch({
            type: METADATA.SET_PROVIDER,
            payload: undefined,
        });

        analytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: '',
            },
        });

        // dispose metadata values (not keys)
        if (removeMetadata) {
            dispatch(disposeMetadata());
        }
    };

/**
 * handleProviderError method controls how application reacts to various errors from metadata providers
 * Toasts go in this format:
 * Error: <Action>: <Reason>
 * Error: Upload failed: Access token is invalid
 */
const handleProviderError =
    (error: MetadataProviderError, action: string) => (dispatch: Dispatch) => {
        // error should be of specified type, but in case it is not (catch is not typed) show generic error
        if (!error?.code) {
            // if this happens, it means that there is a hole in error handling and it should be fixed
            return dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Labeling action failed. ${error}`,
                }),
            );
        }
        // handle nicely wrapped errors here
        switch (error.code) {
            // possibly programmer errors
            // something is screwed up, we don't really know what.
            // react by disabling all metadata and toasting error;
            case 'ACCESS_ERROR':
            case 'BAD_INPUT_ERROR':
            case 'OTHER_ERROR':
                dispatch(disposeMetadata());
                dispatch(disconnectProvider());
                break;
            case 'PROVIDER_ERROR':
            case 'RATE_LIMIT_ERROR':
            case 'AUTH_ERROR':
                dispatch(disconnectProvider());
                break;
            case 'CONNECTIVITY_ERROR':
            default:
                break;
        }

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: `${action}: ${error?.error}`,
            }),
        );
    };

/**
 * Return already existing instance of AbstractProvider or recreate it from token;
 */
const getProviderInstance =
    ({ clientId }: { type?: MetadataProviderType; clientId?: string }) =>
    (_dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        console.log('getProviderInstance', clientId);
        const { providers } = state.metadata;

        const provider = providers.find(p => p.clientId === clientId) || providers[0];

        console.log('provider', provider);
        console.log('providerInstance', providerInstance);

        if (!provider) return;

        // instance already exists but user did not finish log in and decided to use another provider;
        if (providerInstance && providerInstance.type !== provider.type) {
            providerInstance = undefined;
        }

        if (providerInstance) return providerInstance;

        providerInstance = createProviderInstance(
            provider.type,
            provider.tokens,
            state.suite.settings.debug.oauthServerEnvironment,
            clientId,
        );

        return providerInstance;
    };

export const enableMetadata = (): MetadataAction => ({
    type: METADATA.ENABLE,
});

export const disableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.DISABLE,
    });
    // dispose metadata values and keys
    dispatch(disposeMetadata(true));
};

export const initProvider = () => (dispatch: Dispatch) => {
    const decision = createDeferred<boolean>();
    dispatch(modalActions.openModal({ type: 'metadata-provider', decision }));
    return decision.promise;
};

export const fetchMetadata =
    (deviceState: string) => async (dispatch: Dispatch, getState: GetState) => {
        const provider = dispatch(getProviderInstance({}));
        if (!provider) {
            return;
        }
        const device = getState().devices.find(d => d.state === deviceState);

        // device is disconnected or something is wrong with it
        if (device?.metadata?.status !== 'enabled') {
            if (fetchIntervals[deviceState]) {
                clearInterval(fetchIntervals[deviceState]);
                delete fetchIntervals[deviceState];
            }
            return;
        }

        // this triggers renewal of access token if needed. Otherwise multiple requests
        // to renew access token are issued by every provider.getFileContent
        const response = await provider.getProviderDetails();
        if (!response.success) {
            return dispatch(handleProviderError(response, ProviderErrorAction.LOAD));
        }

        const deviceFileContentP = new Promise<void>((resolve, reject) => {
            if (device?.metadata?.status !== 'enabled') {
                return reject(new Error('metadata not enabled for this device'));
            }

            return provider.getFileContent(device.metadata.fileName).then(result => {
                // ts-stuff
                if (device?.metadata?.status !== 'enabled') {
                    // this should never happen
                    return reject(new Error('metadata not enabled for this device'));
                }

                if (!result.success) {
                    return reject(result);
                }

                const json = { walletLabel: '' };
                if (result.payload) {
                    try {
                        const decrypted = metadataUtils.decrypt(
                            metadataUtils.arrayBufferToBuffer(result.payload),
                            device.metadata.aesKey,
                        );

                        dispatch({
                            type: METADATA.SET_DATA,
                            payload: {
                                provider,
                                data: {
                                    [device.metadata.fileName]: decrypted,
                                },
                            },
                        });
                        Object.assign(json, decrypted);
                    } catch (err) {
                        const error = provider.error('OTHER_ERROR', err.message);
                        return reject(error);
                    }
                }
                dispatch({
                    type: METADATA.WALLET_LOADED,
                    payload: {
                        deviceState,
                        walletLabel: json.walletLabel,
                    },
                });

                resolve();
            });
        });

        const accounts = getState().wallet.accounts.filter(
            a => a.deviceState === deviceState && a.metadata.fileName,
        );

        const accountPromises = accounts.map(async account => {
            if (!provider) return; // ts
            console.log('fetching labeling for account: ', account.path);

            const response = await provider.getFileContent(account.metadata.fileName);

            if (!response.success) {
                throw new Error(response.error);
            }

            const json = { accountLabel: '', outputLabels: {}, addressLabels: {} };

            if (response.payload) {
                try {
                    // we found associated metadata file for given account, decrypt it
                    // and save its metadata into reducer;
                    console.log('decrypting filename', account.metadata.fileName);
                    const decrypted = metadataUtils.decrypt(
                        metadataUtils.arrayBufferToBuffer(response.payload),
                        account.metadata.aesKey,
                    );
                    console.log('fetched labeling for account: ', account.path, decrypted);

                    dispatch({
                        type: METADATA.SET_DATA,
                        payload: {
                            provider,
                            data: {
                                [account.metadata.fileName]: decrypted,
                            },
                        },
                    });

                    Object.assign(json, decrypted);
                    // if (json.version === '1.0.0') {
                    //     TODO: migration
                    // }
                } catch (err) {
                    console.error('error fetching labeling for account: ', account.path, err);
                    const error = provider.error('OTHER_ERROR', err.message);
                    return dispatch(handleProviderError(error, ProviderErrorAction.LOAD));
                }
            }

            // dispatch(
            //     setAccountLoaded({
            //         ...account,
            //         metadata: {
            //             ...account.metadata,
            //             accountLabel: json.accountLabel,
            //             outputLabels: json.outputLabels,
            //             addressLabels: json.addressLabels,
            //         },
            //     }),
            // );
        });

        const promises = [deviceFileContentP, ...accountPromises];

        try {
            await Promise.all(promises);
            // if interval for watching provider is not set, create it
            if (!fetchIntervals[deviceState]) {
                fetchIntervals[deviceState] = setInterval(() => {
                    if (!getState().suite.online) {
                        return;
                    }
                    dispatch(fetchMetadata(deviceState));
                }, METADATA.FETCH_INTERVAL);
            }
        } catch (error) {
            // This handles cases of providers that do not support token renewal.
            // We want those to work normally as long as their short-lived token allows. And only if
            // it expires, we want them to silently disconnect provider, keep metadata in place.
            // So that users will not notice that token expired until they will try to add or edit
            // already existing label
            if (fetchIntervals[deviceState]) {
                return dispatch(disconnectProvider(false));
            }
            // If there is no interval set, it means that error occurred in the first fetch
            // in such case, display error notification
            dispatch(handleProviderError(error, ProviderErrorAction.LOAD));
        }
    };

export const setAccountMetadataKey =
    (account: Account) => (dispatch: Dispatch, getState: GetState) => {
        const { devices } = getState();
        const device = devices.find(d => d.state === account.deviceState);
        if (!device || device.metadata.status !== 'enabled') {
            return account;
        }

        try {
            const metaKey = metadataUtils.deriveMetadataKey(
                device.metadata.key,
                account.metadata.key,
            );
            const fileName = metadataUtils.deriveFilename(metaKey) + '.mtdt';

            console.log('account', account.path);
            console.log('filename', fileName);

            const aesKey = metadataUtils.deriveAesKey(metaKey);
            return { ...account, metadata: { ...account.metadata, fileName, aesKey } };
        } catch (error) {
            dispatch(handleProviderError(error, ProviderErrorAction.SAVE));
        }
        return account;
    };

/**
 * Fill any record in reducer that may have metadata with metadata keys (not values).
 */
const syncMetadataKeys = () => (dispatch: Dispatch, getState: GetState) => {
    getState().wallet.accounts.forEach(account => {
        const accountWithMetadata = dispatch(setAccountMetadataKey(account));
        dispatch(setAccountAdd(accountWithMetadata));
    });
    // note that devices are intentionally omitted here - device receives metadata
    // keys sooner when enabling labeling on device;
};

export const selectProvider =
    ({ dataType, clientId }: { dataType: DataType; clientId: string }) =>
    (dispatch: Dispatch) => {
        dispatch({
            type: METADATA.SET_SELECTED_PROVIDER,
            payload: {
                dataType,
                clientId,
            },
        });
    };

export const connectProvider =
    ({
        type,
        clientId,
        dataType = 'labels',
    }: {
        type: MetadataProviderType;
        clientId?: string;
        dataType?: DataType;
    }) =>
    async (dispatch: Dispatch, getState: GetState) => {
        let provider = dispatch(getProviderInstance({ type, clientId }));
        if (!provider) {
            provider = createProviderInstance(
                type,
                {},
                getState().suite.settings.debug.oauthServerEnvironment,
                clientId,
            );
        }
        console.log('provider', provider);

        const isConnected = await provider.isConnected();
        if (!isConnected) {
            const connectionResult = await provider.connect();
            if ('error' in connectionResult) {
                return connectionResult.error;
            }
        }

        const result = await provider.getProviderDetails();
        console.log('result', result);
        if (!result.success) {
            dispatch(handleProviderError(result, ProviderErrorAction.CONNECT));
            return;
        }

        dispatch({
            type: METADATA.ADD_PROVIDER,
            payload: { ...result.payload },
        });

        analytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: result.payload.type,
            },
        });

        dispatch(selectProvider({ dataType, clientId: provider.clientId }));

        return true;
    };

export const addDeviceMetadata =
    (payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = getState().devices.find(d => d.state === payload.deviceState);
        if (!device || device.metadata.status !== 'enabled') return false;

        const walletLabel =
            typeof payload.value === 'string' && payload.value.length > 0
                ? payload.value
                : undefined;

        dispatch({
            type: METADATA.WALLET_ADD,
            payload: {
                deviceState: payload.deviceState,
                walletLabel,
            },
        });

        const provider = await dispatch(getProviderInstance({}));

        if (!provider) {
            // provider should always be set here
            return false;
        }

        try {
            const encrypted = await metadataUtils.encrypt(
                {
                    version: '1.0.0',
                    walletLabel,
                },
                device.metadata.aesKey,
            );
            const result = await provider.setFileContent(device.metadata.fileName, encrypted);
            if (!result.success) {
                dispatch(handleProviderError(result, ProviderErrorAction.SAVE));
                return false;
            }
            return true;
        } catch (err) {
            const error = provider.error('OTHER_ERROR', err.message);
            return dispatch(handleProviderError(error, ProviderErrorAction.SAVE));
        }
    };

/**
 * @param payload - metadata payload
 * @param save - should metadata be saved into persistent storage? this is useful when you are updating multiple records
 *               in a single account you may want to set "save" param to true only for the last call
 */
export const addAccountMetadata =
    (payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>, save = true) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const account = getState().wallet.accounts.find(a => a.key === payload.accountKey);
        const provider = selectSelectedProviderForLabels(getState());

        // const metadata = getState().metadata.providers
        if (!account || !provider) return false;

        const metadata = provider.data[account.metadata.fileName];

        if (!metadata || 'entries' in metadata) return false;

        const nextMetadata = JSON.parse(JSON.stringify(metadata));

        if (payload.type === 'outputLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                if (!nextMetadata.outputLabels[payload.txid]) return false;
                delete nextMetadata.outputLabels[payload.txid][payload.outputIndex];
                if (Object.keys(nextMetadata.outputLabels[payload.txid]).length === 0)
                    delete nextMetadata.outputLabels[payload.txid];
            } else {
                if (!nextMetadata.outputLabels[payload.txid])
                    nextMetadata.outputLabels[payload.txid] = {};
                nextMetadata.outputLabels[payload.txid][payload.outputIndex] = payload.value;
                // 2.0.0
                // metadata.outputLabels[payload.txid][payload.outputIndex] = {
                //     ts,
                //     value: payload.value,
                // };
            }
        }

        if (payload.type === 'addressLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                delete nextMetadata.addressLabels[payload.defaultValue];
            } else {
                nextMetadata.addressLabels[payload.defaultValue] = payload.value;
            }
        }

        if (payload.type === 'accountLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                delete nextMetadata.accountLabel;
            } else {
                nextMetadata.accountLabel = payload.value;
            }
        }

        dispatch({
            type: METADATA.SET_DATA,
            payload: {
                provider,
                data: {
                    [account.metadata.fileName]: nextMetadata,
                },
            },
        });
        // dispatch(
        //     setAccountAdd({
        //         ...account,
        //         metadata,
        //     }),
        // );

        // we might intentionally skip saving metadata content to persistent storage.
        if (!save) return true;

        const providerInstance = await dispatch(getProviderInstance({}));
        if (!providerInstance) {
            // provider should always be set here (see init)
            return false;
        }

        console.log('encrypting filename', account.metadata.fileName);
        // todo: can't this throw? heh?
        const encrypted = await metadataUtils.encrypt(
            {
                version: '1.0.0',
                accountLabel: nextMetadata.accountLabel,
                outputLabels: nextMetadata.outputLabels,
                addressLabels: nextMetadata.addressLabels,
            },
            account.metadata.aesKey,
        );

        const result = await providerInstance.setFileContent(account.metadata.fileName, encrypted);
        console.log('result', result);
        if (!result.success) {
            dispatch(handleProviderError(result, ProviderErrorAction.SAVE));
            return false;
        }
        return true;
    };

/**
 * Generate device master-key
 * */
export const setDeviceMetadataKey = () => async (dispatch: Dispatch, getState: GetState) => {
    if (!getState().metadata.enabled) return;
    const { device } = getState().suite;
    if (!device || !device.state || !device.connected) return;

    // master key already exists
    if (device.metadata.status === 'enabled') return;

    const result = await TrezorConnect.cipherKeyValue({
        device: {
            path: device.path,
            state: device.state,
            instance: device.instance,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        path: METADATA.ENABLE_LABELING_PATH,
        key: METADATA.ENABLE_LABELING_KEY,
        value: METADATA.ENABLE_LABELING_VALUE,
        encrypt: true,
        askOnEncrypt: true,
        askOnDecrypt: true,
    });

    if (result.success) {
        if (!getState().metadata.enabled) {
            dispatch({
                type: METADATA.ENABLE,
            });
        }

        const [stateAddress] = device.state.split('@'); // address@device_id:instance
        const metaKey = metadataUtils.deriveMetadataKey(result.payload.value, stateAddress);
        const fileName = metadataUtils.deriveFilename(metaKey);
        const aesKey = metadataUtils.deriveAesKey(metaKey);

        dispatch({
            type: METADATA.SET_DEVICE_METADATA,
            payload: {
                deviceState: device.state,
                metadata: {
                    status: 'enabled',
                    key: result.payload.value,
                    fileName,
                    aesKey,
                },
            },
        });
    } else {
        dispatch({
            type: METADATA.SET_DEVICE_METADATA,
            payload: {
                deviceState: device.state,
                metadata: {
                    status: 'cancelled',
                },
            },
        });

        // in effort to resolve https://github.com/trezor/trezor-suite/issues/2315
        // also turn of global metadata.enabled setting
        // pros:
        // - user without saved device is not bothered with labeling when reloading page
        // cons:
        // - it makes concept device.metadata.status "cancelled" useless
        // - new device will not be prompted with metadata when connected so even when there is
        //   existing metadata for this device, user will not see it until he clicks "add label" button
        dispatch({
            type: METADATA.DISABLE,
        });
    }
};

export const addMetadata = (payload: MetadataAddPayload) => (dispatch: Dispatch) => {
    if (payload.type === 'walletLabel') {
        return dispatch(addDeviceMetadata(payload));
    }
    return dispatch(addAccountMetadata(payload));
};

/**
 * init - prepare everything needed to load + decrypt and upload + decrypt metadata. Note that this method
 * consists of number of steps of which not all have to necessarily happen. For example
 * user may directly navigate to /settings, enable metadata (by invoking init), but his device
 * does not have state yet.
 * In this case, setDeviceMetadataKey method and those that follow
 * are skipped and user will be asked again either after authorization process or when user
 * tries to add new label.
 */
export const init =
    (force = false) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;

        // 1. set metadata enabled globally
        if (!getState().metadata.enabled) {
            dispatch(enableMetadata());
        }

        if (!device?.state) {
            return false;
        }

        // 2. set device metadata key (master key). Sometimes, if state is not present
        if (
            device.metadata.status === 'disabled' ||
            (device.metadata.status === 'cancelled' && force && device?.connected)
        ) {
            dispatch({ type: METADATA.SET_INITIATING, payload: true });
            await dispatch(setDeviceMetadataKey());
        }

        // did user confirm labeling on device? or maybe device was not connected
        // so suite does not have keys and needs to stop here
        if (getState().suite.device?.metadata.status !== 'enabled') {
            // if no, end here
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
            dispatch({ type: METADATA.SET_EDITING, payload: undefined });

            return false;
        }

        // if yes, add metadata keys to accounts
        if (getState().metadata.initiating) {
            dispatch(syncMetadataKeys());
        }

        // 3. connect to provider
        if (
            getState().suite.device?.metadata.status === 'enabled' &&
            !getState().metadata.providers?.length
        ) {
            if (!getState().metadata.initiating) {
                dispatch({ type: METADATA.SET_INITIATING, payload: true });
            }

            const providerResult = await dispatch(initProvider());
            if (!providerResult) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });

                return false;
            }
        }

        if (getState().metadata.initiating) {
            await dispatch(fetchMetadata(device?.state));
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
        }

        return true;
    };

export const setEditing = (payload: string | undefined): MetadataAction => ({
    type: METADATA.SET_EDITING,
    payload,
});
