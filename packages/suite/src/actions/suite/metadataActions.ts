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
// import * as notificationActions from '@suite-actions/notificationActions';
// import * as accountActions from '@wallet-actions/accountActions';
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
          payload: MetadataProviderCredentials;
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

export const initProvider = () => async (dispatch: Dispatch) => {
    // TODO: check is connected
    const decision = createDeferred<boolean>();
    dispatch(modalActions.openModal({ type: 'metadata-provider', decision }));
    await decision.promise;

    return providerInstance;
};

const getProvider = async (state?: Partial<MetadataProviderCredentials>) => {
    if (!state) return;
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
        const credentials = await providerInstance.getCredentials();
        if (!credentials) {
            // reset provider in reducer
            console.warn('TODO: incorrect credentials');
            return;
        }
    }
    return providerInstance;
};

export const connectProvider = (type: MetadataProviderType) => async (dispatch: Dispatch) => {
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

        return true;
    }
};

export const addDeviceMetadata = (
    payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>,
) => async (dispatch: Dispatch, getState: GetState) => {
    const provider = await getProvider(getState().metadata.provider);
    if (!provider) return;
    const device = getState().devices.find(d => d.state === payload.deviceState);
    if (!device || device.metadata.status !== 'enabled') return;

    const walletLabel =
        typeof payload.value === 'string' && payload.value.length > 0 ? payload.value : undefined;

    const encrypted = await metadataUtils.encrypt(
        {
            version: '1.0.0',
            walletLabel,
        },
        device.metadata.aesKey,
    );

    dispatch({
        type: METADATA.WALLET_ADD,
        payload: {
            deviceState: payload.deviceState,
            walletLabel,
        },
    });

    provider.setFileContent(device.metadata.fileName, encrypted);
};

export const addAccountMetadata = (
    payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>,
) => async (dispatch: Dispatch, getState: GetState) => {
    const account = getState().wallet.accounts.find(a => a.key === payload.accountKey);
    if (!account) return;

    const provider = await getProvider(getState().metadata.provider);

    if (!provider) {
        console.warn('provider is not defined. this should never happen');
        return;
    }

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
            // aha probably here deleted
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

    const encrypted = await metadataUtils.encrypt(
        {
            version: '1.0.0',
            accountLabel: metadata.accountLabel,
            outputLabels: metadata.outputLabels,
            addressLabels: metadata.addressLabels,
        },
        account.metadata.aesKey,
    );

    provider.setFileContent(account.metadata.fileName, encrypted);

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

export const setAccountMetadataKey = (account: Account) => (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device || device.metadata.status !== 'enabled') return account;

    // TODO: ??? check if provider is connected and try to fetch data immediately in parallel process ???

    try {
        const metaKey = metadataUtils.deriveMetadataKey(device.metadata.key, account.metadata.key);
        const fileName = metadataUtils.deriveFilename(metaKey);
        const aesKey = metadataUtils.deriveAesKey(metaKey);
        return { ...account, metadata: { ...account.metadata, fileName, aesKey } };
    } catch (error) {
        // TODO: handle error in UI?
    }
    return account;
};

// Generate device master-key
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

    // const deviceMetadata = getState().metadata.values[device.state];
    // if (deviceMetadata && deviceMetadata.key) return; // already exists

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
        dispatch({
            type: METADATA.ENABLE,
            payload: true,
        });

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
        // TODO: fill existing accounts with metadata keys
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

    // TODO: check if accounts for this device already exists, and fill keys if so
};

export const fetchMetadata = (deviceState: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const provider = await getProvider(getState().metadata.provider);
    if (!provider) return;

    const accounts = getState().wallet.accounts.filter(
        a => a.deviceState === deviceState && a.metadata.fileName,
    );

    // TODO: watch files (sync)
    // TODO: watch internet connection
    // TODO: run fetching in parallel
    const device = getState().devices.find(d => d.state === deviceState);
    if (!device || device.metadata.status !== 'enabled') return;

    try {
        const buffer = await provider.getFileContent(device.metadata.fileName);
        if (buffer) {
            const json = metadataUtils.decrypt(
                metadataUtils.getFileContent(buffer),
                device!.metadata.aesKey,
            );
            console.warn('DONE decrypted device!', json);

            dispatch({
                type: METADATA.WALLET_LOADED,
                payload: {
                    deviceState,
                    walletLabel: json.walletLabel,
                },
            });
        }
    } catch (error) {
        console.warn('fetchMetadata-device', error);
    }

    const promises = accounts.map(async account => {
        try {
            const buffer = await provider.getFileContent(account.metadata.fileName);
            if (buffer) {
                const json = metadataUtils.decrypt(
                    metadataUtils.getFileContent(buffer),
                    account.metadata.aesKey,
                );
                console.warn('DONE decrypted account!', json);

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
        } catch (error) {
            console.warn('fetchMetadata-accounts', error);
        }
    });
    return Promise.all(promises);
};

/**
 * addMetadata method is intended to be called from component. Option to call it should
 * appear only if metadata is enabled globally. This method shall then take care of everything
 * needed to save metadata into a long-term storage.
 */
export const addMetadata = (payload: MetadataAddPayload) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // make sure metadata is enabled globally
    const { metadata } = getState();

    if (!metadata.enabled) {
        console.warn('metadata is disabled globally, this should not actually happen');
        return;
    }

    // make sure user has metadata enabled for this device
    let { device } = getState().suite;

    if (!device?.state) return;

    const needsUpdate = device?.metadata.status !== 'enabled';

    // user might have clicked cancel on device when he was prompting to enable labeling. In this case
    // we override his choice as he is apparently willing to add label.
    if (needsUpdate) {
        // prompt again to get metadata master key
        await dispatch(setDeviceMetadataKey(true));
    }

    // check if there is already initialized provider instance
    let provider = await getProvider(getState().metadata.provider);

    // if not, init provider log in flow but do not wait for it to finish as we may  already do
    // some more synchronous tasks without waiting.
    let providerPromise;
    if (!provider) {
        providerPromise = dispatch(initProvider());
    }

    // this can actually be parallel to provider logging in
    if (needsUpdate) {
        // todo: fill all objects (accounts, transactions) with metadata keys. (really all ?)
        getState().wallet.accounts.forEach(account => {
            const accountWithMetadata = dispatch(setAccountMetadataKey(account));
            dispatch({
                type: METADATA.ACCOUNT_ADD,
                payload: accountWithMetadata,
            });
        });
    }

    // wait for provider here because right after this point, we are going to fetch data from provider
    await providerPromise;
    provider = await getProvider(getState().metadata.provider);

    if (!provider) {
        return;
    }

    // save reference to original value. we need to compare old and new value to determine
    // if we need to save new value. If it hasn't changed we don't need to save it.
    let originalValue = payload.value;

    if (needsUpdate) {
        await dispatch(fetchMetadata(device?.state));
        // check if there is value to pre fill into user input

        if (payload.type === 'walletLabel') {
            device = getState().suite.device;
            if (
                device?.features &&
                device?.metadata.status === 'enabled' &&
                device?.metadata.walletLabel
            ) {
                payload.value = device.metadata.walletLabel;
            }
            // todo:
        } else {
            const account = getState().wallet.accounts.find(acc => acc.key === payload.accountKey);
            if (payload.type === 'accountLabel' && account?.metadata.accountLabel) {
                payload.value = account?.metadata.accountLabel;
            }
            if (
                payload.type === 'addressLabel' &&
                account?.metadata.addressLabels[payload.defaultValue]
            ) {
                payload.value = account?.metadata.addressLabels[payload.defaultValue];
            }
            if (
                payload.type === 'outputLabel' &&
                account?.metadata.outputLabels[payload.txid][payload.outputIndex]
            ) {
                payload.value = account?.metadata.outputLabels[payload.txid][payload.outputIndex];
            }
        }
        // ?
        originalValue = payload.value;
    }
    const decision = createDeferred<string | undefined>();

    dispatch(
        modalActions.openModal({
            type: 'metadata-add',
            payload,
            decision,
        }),
    );

    const value = await decision.promise;

    // value did not change, stop here
    if (value === originalValue) {
        return;
    }

    if (payload.type === 'walletLabel') {
        dispatch(addDeviceMetadata({ ...payload, value }));
    } else {
        dispatch(addAccountMetadata({ ...payload, value }));
    }
};

export const init = (force = false) => async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(setDeviceMetadataKey(force));
    // console.warn('getProvider(getState().metadata.provider)', getProvider(getState().metadata.provider));
    if (getState().suite.device?.metadata.status === 'enabled' && !getState().metadata.provider) {
        await dispatch(initProvider());
    }
};

export const enableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.ENABLE,
    });
    dispatch(init(true));
};

export const disableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.DISABLE,
    });
};
