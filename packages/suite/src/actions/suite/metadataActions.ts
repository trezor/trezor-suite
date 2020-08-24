import TrezorConnect from 'trezor-connect';
import { METADATA } from '@suite-actions/constants';
import { createDeferred } from '@suite-utils/deferred';
import { Dispatch, GetState } from '@suite-types';
import {
    AbstractMetadataProvider,
    MetadataProviderType,
    MetadataProviderCredentials,
    MetadataAddPayload,
    DeviceMetadata,
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
let providerInstance: AbstractMetadataProvider | undefined;
let fetchInterval: any; // any because of native at the moment, otherwise number | undefined

const getProvider = async (state?: Partial<MetadataProviderCredentials>) => {
    if (!state) return;
    // instance already exists but user did not finish log in and decided to use another provider;
    if (providerInstance && providerInstance.type !== state.type) {
        providerInstance = undefined;
    }
    if (providerInstance) return providerInstance;
    switch (state.type) {
        case 'dropbox':
            providerInstance = new DropboxProvider(state.token);
            break;
        case 'google':
            providerInstance = new GoogleProvider(state.token);
            break;
        default:
            break;
    }

    if (providerInstance && state.token) {
        await providerInstance.getCredentials();
    }
    return providerInstance;
};

export const enableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.ENABLE,
    });
};

export const disposeMetadata = () => (dispatch: Dispatch, getState: GetState) => {
    getState().wallet.accounts.forEach(account => {
        dispatch({
            type: METADATA.ACCOUNT_ADD,
            payload: {
                ...account,
                metadata: {
                    key: account.metadata.key,
                    fileName: '',
                    aesKey: '',
                    outputLabels: {},
                    addressLabels: {},
                    accountLabel: '',
                },
            },
        });
    });
    getState().devices.forEach(device => {
        if (device.state) {
            dispatch({
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: device.state,
                    metadata: {
                        status: 'disabled',
                    },
                },
            });
        }
    });
};

export const disableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.DISABLE,
    });
    dispatch(disposeMetadata());
};

export const initProvider = () => async (dispatch: Dispatch) => {
    const decision = createDeferred<boolean>();
    dispatch(modalActions.openModal({ type: 'metadata-provider', decision }));
    return decision.promise;
};

export const disconnectProvider = () => async (dispatch: Dispatch, getState: GetState) => {
    if (fetchInterval) {
        clearInterval(fetchInterval);
    }
    try {
        const provider = await getProvider(getState().metadata.provider);
        if (provider) {
            await provider.disconnect();
            providerInstance = undefined;
        }
    } catch (error) {
        // not sure if toast here or not? might make sense to error silently here...
    }
    // flush reducer
    dispatch({
        type: METADATA.SET_PROVIDER,
        payload: undefined,
    });
    dispatch(disposeMetadata());
};

const handleProviderError = (error: Error) => (dispatch: Dispatch, getState: GetState) => {
    const { metadata } = getState();
    const unexpectedError = 'labeling action failed with unexpected error';
    if (!error) {
        return dispatch(
            notificationActions.addToast({
                type: 'error',
                error: unexpectedError,
            }),
        );
    }
    // @ts-ignore todo: type error;
    switch (error.status) {
        case 403:
        case 401:
            if (getState().metadata.provider) {
                dispatch(
                    notificationActions.addToast({
                        type: 'error',
                        error: `Failed to sync labeling data with cloud provider (${
                            metadata!.provider!.type
                        }). User was logged out.`,
                    }),
                );
                dispatch(disconnectProvider());
            }
            break;
        case 404:
            dispatch(
                notificationActions.addToast({
                    type: 'error',
                    error: 'Failed to find metadata in cloud provider.',
                }),
            );
            dispatch(disconnectProvider());
            break;
        default:
            dispatch(notificationActions.addToast({ type: 'error', error: unexpectedError }));
            break;
    }
};

export const fetchMetadata = (deviceState: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    let provider: undefined | AbstractMetadataProvider;
    try {
        provider = await getProvider(getState().metadata.provider);
    } catch (error) {
        dispatch(handleProviderError(error));
    }
    if (!provider) return;

    // TODO: watch internet connection

    const device = getState().devices.find(d => d.state === deviceState);

    // if interval for watching provider is not set, create it
    if (!fetchInterval) {
        fetchInterval = setInterval(() => {
            if (!device?.state) return;
            dispatch(fetchMetadata(device?.state));
        }, METADATA.FETCH_INTERVAL);
    }

    const deviceFileContentP = (async () => {
        if (!device || device.metadata.status !== 'enabled') return;

        const buffer = await provider.getFileContent(device.metadata.fileName);
        if (buffer) {
            const json = metadataUtils.decrypt(
                metadataUtils.getFileContent(buffer),
                device!.metadata.aesKey,
            );

            dispatch({
                type: METADATA.WALLET_LOADED,
                payload: {
                    deviceState,
                    walletLabel: json.walletLabel,
                },
            });
        }
    })();

    const accounts = getState().wallet.accounts.filter(
        a => a.deviceState === deviceState && a.metadata.fileName,
    );

    const accountPromises = accounts.map(async account => {
        if (!provider) return; // ts
        const buffer = await provider.getFileContent(account.metadata.fileName);
        // in if brach, we found associated metadata file for given account, decrypt it
        // and save its metadata into reducer;
        if (buffer) {
            const json = metadataUtils.decrypt(
                metadataUtils.getFileContent(buffer),
                account.metadata.aesKey,
            );
            if (json.version === '1.0.0') {
                // TODO: migration
            }
            dispatch({
                type: METADATA.ACCOUNT_LOADED,
                payload: {
                    ...account,
                    metadata: {
                        ...account.metadata,
                        accountLabel: json.accountLabel,
                        outputLabels: json.outputLabels || {},
                        addressLabels: json.addressLabels || {},
                    },
                },
            });
        }
    });

    const promises = [deviceFileContentP, ...accountPromises];

    return Promise.all(promises).then(
        result => result,
        error => {
            dispatch(handleProviderError(error));
        },
    );
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
        dispatch(handleProviderError(error));
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
};

export const connectProvider = (type: MetadataProviderType) => async (dispatch: Dispatch) => {
    try {
        const provider = await getProvider({ type });
        if (!provider) return;

        const connected = await provider.connect();

        if (connected) {
            const credentials = await provider.getCredentials();
            if (!credentials) {
                return;
            }
            // TODO: toast errors
            // set metadata reducer
            dispatch({
                type: METADATA.SET_PROVIDER,
                payload: credentials,
            });

            return true;
        }
    } catch (error) {
        dispatch(handleProviderError(error));
    }
};

export const addDeviceMetadata = (
    payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>,
) => async (dispatch: Dispatch, getState: GetState) => {
    try {
        const device = getState().devices.find(d => d.state === payload.deviceState);
        if (!device || device.metadata.status !== 'enabled') return;

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

        const provider = await getProvider(getState().metadata.provider);
        if (provider) {
            const encrypted = await metadataUtils.encrypt(
                {
                    version: '1.0.0',
                    walletLabel,
                },
                device.metadata.aesKey,
            );
            provider.setFileContent(device.metadata.fileName, encrypted);
        }
    } catch (error) {
        dispatch(handleProviderError(error));
    }
};

export const addAccountMetadata = (
    payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>,
) => async (dispatch: Dispatch, getState: GetState) => {
    const account = getState().wallet.accounts.find(a => a.key === payload.accountKey);
    if (!account) return;
    try {
        // clone Account.metadata
        const metadata = JSON.parse(JSON.stringify(account.metadata));
        if (payload.type === 'outputLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                if (!metadata.outputLabels[payload.txid]) return;
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

        const provider = await getProvider(getState().metadata.provider);

        if (provider) {
            const encrypted = await metadataUtils.encrypt(
                {
                    version: '1.0.0',
                    accountLabel: metadata.accountLabel,
                    outputLabels: metadata.outputLabels,
                    addressLabels: metadata.addressLabels,
                },
                account.metadata.aesKey,
            );

            await provider.setFileContent(account.metadata.fileName, encrypted);
        }
    } catch (error) {
        dispatch(handleProviderError(error));
    }
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
    }
};

export const addMetadata = (payload: MetadataAddPayload) => async (dispatch: Dispatch) => {
    try {
        if (payload.type === 'walletLabel') {
            dispatch(addDeviceMetadata(payload));
        } else {
            dispatch(addAccountMetadata(payload));
        }
    } catch (error) {
        dispatch(handleProviderError(error));
    }
};

/**
 * initMetadata - prepare everything needed to load + decrypt and upload + decrypt metadata. Note that this method
 * consists of number of steps of which not all have to necessarily happen. For example
 * user may directly navigate to /settings, enable metadata (by invoking init), but his device
 * does not have state yet. In this case, setDeviceMetadataKey method and those that follow
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
        (device.metadata.status === 'cancelled' && force)
    ) {
        dispatch({ type: METADATA.SET_INITIATING, payload: true });

        await dispatch(setDeviceMetadataKey());
    }

    // did user confirm labeling on device?
    if (getState().suite.device?.metadata.status !== 'enabled') {
        dispatch({ type: METADATA.SET_INITIATING, payload: false });

        return false;
    }

    dispatch(syncMetadataKeys());

    // 3. connect to provider
    if (getState().suite.device?.metadata.status === 'enabled' && !getState().metadata.provider) {
        if (!getState().metadata.initiating) {
            dispatch({ type: METADATA.SET_INITIATING, payload: true });
        }

        const providerResult = await dispatch(initProvider());
        if (!providerResult) {
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
            return;
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
