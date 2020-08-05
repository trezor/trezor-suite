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
    | {
          type: typeof METADATA.SET_MASTER_KEY;
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
    // todo: dispose deviceMetadata
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
            provider.disconnect();
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
    if (!error) {
        return dispatch(
            notificationActions.addToast({
                type: 'error',
                error: 'action failed with unknown error',
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
                        error: `Failed to sync data with cloud provider (${
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
            dispatch(notificationActions.addToast({ type: 'error', error: 'action failed' }));
            break;
    }
};

export const fetchMetadata = (deviceState: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // todo: remove log. now useful to detect excessive fetching
    // console.warn('fetchMetadata');
    const provider = await getProvider(getState().metadata.provider);
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
        } else if (device.metadata.walletLabel) {
            // here we know that there is no file saved in cloud but user has added metadata locally
            // so we save it to cloud to make it persistent.
            const encrypted = await metadataUtils.encrypt(
                {
                    version: '1.0.0',
                    walletLabel: device.metadata.walletLabel,
                },
                device.metadata.aesKey,
            );
            provider.setFileContent(device.metadata.fileName, encrypted);
        }
    })();

    const accounts = getState().wallet.accounts.filter(
        a => a.deviceState === deviceState && a.metadata.fileName,
    );

    const accountPromises = accounts.map(async account => {
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
            // console.warn('decrypted', json);
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
        } else if (
            // in else branch, if we find that some account has metadata, it means that it is not synced to cloud.
            Object.values(account.metadata.addressLabels).length ||
            Object.values(account.metadata.outputLabels).length ||
            account.metadata.accountLabel
        ) {
            const encrypted = await metadataUtils.encrypt(
                {
                    version: '1.0.0',
                    accountLabel: account.metadata.accountLabel,
                    outputLabels: account.metadata.outputLabels,
                    addressLabels: account.metadata.addressLabels,
                },
                account.metadata.aesKey,
            );

            await provider.setFileContent(account.metadata.fileName, encrypted);
        }
    });

    const promises = [deviceFileContentP, ...accountPromises];

    return Promise.all(promises).then(
        result => {
            return result;
        },
        error => {
            console.warn('error', error);
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

export const connectProvider = (type: MetadataProviderType) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    try {
        // console.warn('connectProvider', type);
        const provider = await getProvider({ type });
        if (!provider) return;

        const connected = await provider.connect();

        if (connected) {
            const credentials = await provider.getCredentials();
            if (!credentials) return; // TODO: toast errors

            // set metadata reducer
            dispatch({
                type: METADATA.SET_PROVIDER,
                payload: credentials,
            });

            const { device } = getState().suite;

            if (!device?.state) return;

            const result = dispatch(fetchMetadata(device?.state));

            dispatch(syncMetadataKeys());

            await result;

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
        } else {
            dispatch(notificationActions.addToast({ type: 'metadata-saved-locally' }));
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
        // const ts = new Date().getTime();
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
        } else {
            dispatch(notificationActions.addToast({ type: 'metadata-saved-locally' }));
            // todo: probably toast that data was saved locally only
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

export const setDeviceMetadataKey = (force = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    if (!getState().metadata.enabled) return;
    const { device } = getState().suite;
    if (!device || !device.state) return;

    // user was already asked for master key (Enable labeling) but refused
    if (!force && device.metadata.status === 'cancelled') return;

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
            type: METADATA.SET_MASTER_KEY,
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
            type: METADATA.SET_MASTER_KEY,
            payload: {
                deviceState: device.state,
                metadata: {
                    status: 'cancelled',
                },
            },
        });
    }
};

/**
 * When opening modal, pre fill value with value from reducer (after it got updated by fetchMetadata)
 * This way user will not overwrite possibly existing metadata
 */
// const syncMetadataPayload = (payload: MetadataAddPayload) => (
//     _dispatch: Dispatch,
//     getState: GetState,
// ) => {
//     // check if there is value to pre fill into user input

//     if (payload.type === 'walletLabel') {
//         const { device } = getState().suite;
//         if (
//             device?.features &&
//             device?.metadata.status === 'enabled' &&
//             device?.metadata.walletLabel
//         ) {
//             payload.value = device.metadata.walletLabel;
//         }
//     } else {
//         const account = getState().wallet.accounts.find(acc => acc.key === payload.accountKey);
//         if (payload.type === 'accountLabel' && account?.metadata.accountLabel) {
//             payload.value = account?.metadata.accountLabel;
//         }
//         if (
//             payload.type === 'addressLabel' &&
//             account?.metadata.addressLabels[payload.defaultValue]
//         ) {
//             payload.value = account?.metadata.addressLabels[payload.defaultValue];
//         }
//         if (
//             payload.type === 'outputLabel' &&
//             account?.metadata.outputLabels[payload.txid][payload.outputIndex]
//         ) {
//             payload.value = account?.metadata.outputLabels[payload.txid][payload.outputIndex];
//         }
//     }
//     return payload;
// };

/**
 * addMetadata method is intended to be called from component. Option to call it should
 * appear only if metadata is enabled globally. This method shall then take care of everything
 * needed to save metadata into a long-term storage.
 */
export const addMetadata = (payload: MetadataAddPayload) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // console.warn('add metadata', payload);
    try {
        // make sure metadata is enabled globally
        const { metadata } = getState();
        const { device } = getState().suite;
        let provider = await getProvider(getState().metadata.provider);

        // needs update indicates that metadata is probably out-of-sync with cloud
        // const needsUpdate =
        //     device?.metadata?.status !== 'enabled' || !metadata.enabled || !provider;

        if (!device?.state) return;

        // metadata is not enabled, it means that suite does not try to generate keys and download and decrypt files, but user activates
        // metadata when trying to add it.
        if (!metadata.enabled) {
            dispatch(enableMetadata());
        }

        if (device?.metadata?.status !== 'enabled') {
            // prompt again to get metadata master key
            await dispatch(setDeviceMetadataKey(true));
        }

        // user might have cancelled metadata on device
        if (getState().suite.device?.metadata.status !== 'enabled') {
            return;
        }
        // if not, init provider log-in flow but do not wait for it to finish as we may  already do
        // some more synchronous tasks without waiting.
        if (!provider) {
            // init provider calls opens modal from which connect provider is called
            await dispatch(initProvider());
        }

        provider = await getProvider(getState().metadata.provider);
        // at this point, provider might still be undefined. It means that metadata will be saved only locally.

        // // save reference to original value. we need to compare old and new value to determine
        // // if we need to save new value. If it hasn't changed we don't need to save it.
        // let originalValue = payload.value;

        // if (needsUpdate && provider) {
        //     // after metadata is loaded, pre fill corresponding metadata value into payload
        //     payload = dispatch(syncMetadataPayload(payload));

        //     originalValue = payload.value;
        // }
        // const decision = createDeferred<string | undefined>();

        // dispatch(
        //     modalActions.openModal({
        //         type: 'metadata-add',
        //         payload,
        //         decision,
        //     }),
        // );

        // const value = await decision.promise;
        // console.log('value in action', originalValue, value);
        // // value did not change, no need to sync with cloud, stop here
        // if (value === originalValue) {
        //     return;
        // }
        // if (payload.type === 'walletLabel') {
        //     dispatch(addDeviceMetadata({ ...payload, value }));
        // } else {
        //     dispatch(addAccountMetadata({ ...payload, value }));
        // }

        if (payload.type === 'walletLabel') {
            dispatch(addDeviceMetadata({ ...payload }));
        } else {
            dispatch(addAccountMetadata({ ...payload }));
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
    if (!device?.state) return false;

    // 1. set metadata enabled globally
    if (!getState().metadata.enabled) {
        dispatch(enableMetadata());
    }

    // 2. set device metadata key (master key). Sometimes, if state is not present
    if (device.metadata.status !== 'enabled' && force) {
        await dispatch(setDeviceMetadataKey(force));
    }

    if (getState().suite.device?.metadata.status !== 'enabled') return false;

    // 3. connect to provider
    if (getState().suite.device?.metadata.status === 'enabled' && !getState().metadata.provider) {
        // returns promise which resolves to true of connection established
        return dispatch(initProvider());
    }

    // todo: token might have expired?
    return true;
};
