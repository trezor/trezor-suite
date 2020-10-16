import TrezorConnect from 'trezor-connect';
import { METADATA } from '@suite-actions/constants';
import { createDeferred } from '@suite-utils/deferred';
import { Dispatch, GetState } from '@suite-types';
import {
    MetadataProviderType,
    MetadataProviderCredentials,
    MetadataAddPayload,
    DeviceMetadata,
    Error as MetadataProviderError,
    ProviderErrorAction,
} from '@suite-types/metadata';
import { Account } from '@wallet-types';
import * as metadataUtils from '@suite-utils/metadata';
import * as modalActions from '@suite-actions/modalActions';
import * as notificationActions from '@suite-actions/notificationActions';
import DropboxProvider from '@suite/services/metadata/DropboxProvider';
import GoogleProvider from '@suite/services/metadata/GoogleProvider';

export type MetadataActions =
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
          payload: MetadataProviderCredentials | undefined;
      }
    | {
          type: typeof METADATA.WALLET_LOADED | typeof METADATA.WALLET_ADD;
          payload: { deviceState: string; walletLabel?: string };
      }
    | {
          type: typeof METADATA.ACCOUNT_LOADED | typeof METADATA.ACCOUNT_ADD;
          payload: Account;
      };

// needs to be declared here in top level context because it's not recommended to keep classes instances in redux state (serialization)
let providerInstance: DropboxProvider | GoogleProvider | undefined;
const fetchIntervals: { [deviceState: string]: any } = {}; // any because of native at the moment, otherwise number | undefined

const createProvider = (
    type: MetadataProviderCredentials['type'],
    token?: MetadataProviderCredentials['token'],
) => {
    switch (type) {
        case 'dropbox':
            return new DropboxProvider(token);
        case 'google':
            return new GoogleProvider(token);
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
            // always remove metadata  values
            outputLabels: {},
            addressLabels: {},
            accountLabel: '',
        };

        // and sometimes remove also keys (information we can only if device is connected)
        if (keys) {
            updatedMetadata.fileName = '';
            updatedMetadata.aesKey = '';
        }

        dispatch({
            type: METADATA.ACCOUNT_ADD,
            payload: {
                ...account,
                metadata: updatedMetadata,
            },
        });
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

export const disconnectProvider = () => async (dispatch: Dispatch) => {
    Object.values(fetchIntervals).forEach((deviceState, num) => {
        clearInterval(num);
        delete fetchIntervals[deviceState];
    });

    /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
    const provider = await dispatch(getProvider());
    if (provider) {
        await provider.disconnect();
        providerInstance = undefined;
    }
    // flush reducer
    dispatch({
        type: METADATA.SET_PROVIDER,
        payload: undefined,
    });

    // dispose metadata values (not keys)
    dispatch(disposeMetadata());
};

/**
 * handleProviderError method controls how application reacts to various errors from metadata providers
 * Toasts go in this format:
 * Error: <Action>: <Reason>
 * Error: Upload failed: Access token is invalid
 */
const handleProviderError = (error: MetadataProviderError, action: string) => (
    dispatch: Dispatch,
) => {
    // error should be of specified type, but in case it is not (catch is not typed) show generic error
    if (!error?.code) {
        // if this happens, it means that there is a hole in error handling and it should be fixed
        return dispatch(
            notificationActions.addToast({
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
        default:
            break;
    }

    dispatch(
        notificationActions.addToast({
            type: 'error',
            error: `${action}: ${error?.error}`,
        }),
    );
};

/**
 * Return already existing instance of AbstractProvider or recreate it from token;
 */
const getProvider = () => async (_dispatch: Dispatch, getState: GetState) => {
    const state = getState().metadata.provider;
    if (!state) return;

    // instance already exists but user did not finish log in and decided to use another provider;
    if (providerInstance && providerInstance.type !== state.type) {
        providerInstance = undefined;
    }

    if (providerInstance) return providerInstance;

    providerInstance = createProvider(state.type, state.token);

    return providerInstance;
};

export const enableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.ENABLE,
    });
};

export const disableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.DISABLE,
    });
    // dispose metadata values and keys
    dispatch(disposeMetadata(true));
};

export const initProvider = () => async (dispatch: Dispatch) => {
    const decision = createDeferred<boolean>();
    dispatch(modalActions.openModal({ type: 'metadata-provider', decision }));
    return decision.promise;
};

export const fetchMetadata = (deviceState: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const provider = await dispatch(getProvider());
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
    const response = await provider.getCredentials();
    if (!response.success) return;

    const deviceFileContentP = new Promise((resolve, reject) => {
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
                    Object.assign(
                        json,
                        metadataUtils.decrypt(
                            metadataUtils.arrayBufferToBuffer(result.payload),
                            device.metadata.aesKey,
                        ),
                    );
                } catch (err) {
                    const error = provider.error('OTHER_ERROR', err.message);
                    // dispatch(handleProviderError(error, ProviderErrorAction.LOAD));
                    // todo: ?
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
        const response = await provider.getFileContent(account.metadata.fileName);

        if (!response.success) {
            throw new Error(response.error);
        }

        const json = { accountLabel: '', outputLabels: {}, addressLabels: {} };

        if (response.payload) {
            try {
                // we found associated metadata file for given account, decrypt it
                // and save its metadata into reducer;
                Object.assign(
                    json,
                    metadataUtils.decrypt(
                        metadataUtils.arrayBufferToBuffer(response.payload),
                        account.metadata.aesKey,
                    ),
                );
                // if (json.version === '1.0.0') {
                //     TODO: migration
                // }
            } catch (err) {
                // todo? ??
                const error = provider.error('OTHER_ERROR', err.message);
                return dispatch(handleProviderError(error, ProviderErrorAction.LOAD));
            }
        }

        dispatch({
            type: METADATA.ACCOUNT_LOADED,
            payload: {
                ...account,
                metadata: {
                    ...account.metadata,
                    accountLabel: json.accountLabel,
                    outputLabels: json.outputLabels,
                    addressLabels: json.addressLabels,
                },
            },
        });
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
        // todo: isn't it better to clear interval here?
        dispatch(handleProviderError(error, ProviderErrorAction.LOAD));
    }
};

export const setAccountMetadataKey = (account: Account) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device || device.metadata.status !== 'enabled') return account;

    try {
        const metaKey = metadataUtils.deriveMetadataKey(device.metadata.key, account.metadata.key);
        const fileName = metadataUtils.deriveFilename(metaKey);
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
        dispatch({
            type: METADATA.ACCOUNT_ADD,
            payload: accountWithMetadata,
        });
    });
    // note that devices are intentionally omitted here - device receives metadata
    // keys sooner when enabling labeling on device;
};

export const connectProvider = (type: MetadataProviderType) => async (dispatch: Dispatch) => {
    let provider = await dispatch(getProvider());
    if (!provider) {
        provider = createProvider(type);
    }
    const isConnected = await provider.isConnected();
    if (provider && !isConnected) {
        const connected = await provider.connect();
        if (!connected) {
            return;
        }
    }

    const result = await provider.getCredentials();
    if (!result.success) {
        dispatch(handleProviderError(result, ProviderErrorAction.CONNECT));
        return;
    }

    dispatch({
        type: METADATA.SET_PROVIDER,
        payload: result.payload,
    });

    return true;
};

export const addDeviceMetadata = (
    payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>,
) => async (dispatch: Dispatch, getState: GetState) => {
    const device = getState().devices.find(d => d.state === payload.deviceState);
    if (!device || device.metadata.status !== 'enabled') return false;

    const walletLabel =
        typeof payload.value === 'string' && payload.value.length > 0 ? payload.value : undefined;

    dispatch({
        type: METADATA.WALLET_ADD,
        payload: {
            deviceState: payload.deviceState,
            walletLabel,
        },
    });

    const provider = await dispatch(getProvider());

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

export const addAccountMetadata = (
    payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>,
) => async (dispatch: Dispatch, getState: GetState) => {
    const account = getState().wallet.accounts.find(a => a.key === payload.accountKey);
    if (!account) return false;
    // clone Account.metadata
    const metadata = JSON.parse(JSON.stringify(account.metadata));

    if (payload.type === 'outputLabel') {
        if (typeof payload.value !== 'string' || payload.value.length === 0) {
            if (!metadata.outputLabels[payload.txid]) return false;
            delete metadata.outputLabels[payload.txid][payload.outputIndex];
            if (Object.keys(metadata.outputLabels[payload.txid]).length === 0)
                delete metadata.outputLabels[payload.txid];
        } else {
            if (!metadata.outputLabels[payload.txid]) metadata.outputLabels[payload.txid] = {};
            metadata.outputLabels[payload.txid][payload.outputIndex] = payload.value;
            // 2.0.0
            // metadata.outputLabels[payload.txid][payload.outputIndex] = {
            //     ts,
            //     value: payload.value,
            // };
        }
    }

    if (payload.type === 'addressLabel') {
        if (typeof payload.value !== 'string' || payload.value.length === 0) {
            delete metadata.addressLabels[payload.defaultValue];
        } else {
            metadata.addressLabels[payload.defaultValue] = payload.value;
        }
    }

    if (payload.type === 'accountLabel') {
        if (typeof payload.value !== 'string' || payload.value.length === 0) {
            delete metadata.accountLabel;
        } else {
            metadata.accountLabel = payload.value;
        }
    }

    dispatch({
        type: METADATA.ACCOUNT_ADD,
        payload: {
            ...account,
            metadata,
        },
    });

    const provider = await dispatch(getProvider());
    if (!provider) {
        // provider should always be set here (see init)
        return false;
    }

    // todo: can't this throw? heh?
    const encrypted = await metadataUtils.encrypt(
        {
            version: '1.0.0',
            accountLabel: metadata.accountLabel,
            outputLabels: metadata.outputLabels,
            addressLabels: metadata.addressLabels,
        },
        account.metadata.aesKey,
    );

    const result = await provider.setFileContent(account.metadata.fileName, encrypted);
    if (!result.success) {
        dispatch(handleProviderError(result, ProviderErrorAction.SAVE));
        return false;
    }
    return true;
    // const { ipcRenderer } = global;
    // if (ipcRenderer) {
    //     const onIpcSave = (sender, message) => {
    //         console.warn('onIpcSave', message);
    //     };

    //     const onIpcRead = (sender, message) => {
    //         console.warn('onIpcRead', message);
    //     };
    //     ipcRenderer.on('metadata-on-save', onIpcSave);
    //     ipcRenderer.on('metadata-on-read', onIpcRead);

    //     ipcRenderer.send('metadata-save', { file: 'foo.txt', content: 'content!' });
    //     ipcRenderer.send('metadata-read', { file: 'foo.txt' });
    // }
};

/**
 * Generate device master-key
 * */
export const setDeviceMetadataKey = () => async (dispatch: Dispatch, getState: GetState) => {
    if (!getState().metadata.enabled) return;
    const { device } = getState().suite;
    if (!device || !device.state) return;

    // mater key already exists
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

export const addMetadata = (payload: MetadataAddPayload) => async (dispatch: Dispatch) => {
    if (payload.type === 'walletLabel') {
        return dispatch(addDeviceMetadata(payload));
    }
    return dispatch(addAccountMetadata(payload));
};

/**
 * initMetadata - prepare everything needed to load + decrypt and upload + decrypt metadata. Note that this method
 * consists of number of steps of which not all have to necessarily happen. For example
 * user may directly navigate to /settings, enable metadata (by invoking init), but his device
 * does not have state yet.
 * In this case, setDeviceMetadataKey method and those that follow
 * are skipped and user will be asked again either after authorization process or when user
 * tries to add new label.
 */
export const init = (force = false) => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device?.state) {
        return false;
    }

    // 1. set metadata enabled globally
    if (!getState().metadata.enabled) {
        dispatch(enableMetadata());
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
    if (getState().suite.device?.metadata.status === 'enabled' && !getState().metadata.provider) {
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

export const setEditing = (payload: string | undefined) => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.SET_EDITING,
        payload,
    });
};
