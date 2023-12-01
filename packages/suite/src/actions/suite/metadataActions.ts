/* eslint @typescript-eslint/no-use-before-define: 1 */
import { createAction } from '@reduxjs/toolkit';

import TrezorConnect from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { createDeferred, cloneObject } from '@trezor/utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDevices, selectDevice, selectDeviceByState } from '@suite-common/wallet-core';

import { METADATA } from 'src/actions/suite/constants';
import { Dispatch, GetState, TrezorDevice } from 'src/types/suite';
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
    MetadataEncryptionVersion,
    WalletLabels,
    AccountLabels,
} from 'src/types/suite/metadata';
import { Account } from 'src/types/wallet';
import * as metadataUtils from 'src/utils/suite/metadata';
import * as modalActions from 'src/actions/suite/modalActions';
import DropboxProvider from 'src/services/suite/metadata/DropboxProvider';
import GoogleProvider from 'src/services/suite/metadata/GoogleProvider';
import FileSystemProvider from 'src/services/suite/metadata/FileSystemProvider';
import {
    selectLabelableEntities,
    selectMetadata,
    selectSelectedProviderForLabels,
} from 'src/reducers/suite/metadataReducer';

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
          type: typeof METADATA.REMOVE_PROVIDER;
          payload: MetadataProvider;
      }
    | {
          type: typeof METADATA.ADD_PROVIDER;
          payload: MetadataProvider;
      }
    | {
          type: typeof METADATA.SET_DATA;
          payload: {
              provider: MetadataProvider;
              data: Record<string, Labels>;
          };
      }
    | {
          type: typeof METADATA.SET_SELECTED_PROVIDER;
          payload: {
              dataType: DataType;
              clientId: string;
          };
      }
    | {
          type: typeof METADATA.SET_ERROR_FOR_DEVICE;
          payload: { deviceState: string; failed: boolean };
      }
    | ReturnType<typeof setAccountAdd>;

// needs to be declared here in top level context because it's not recommended to keep classes instances in redux state (serialization)
const providerInstance: Record<
    DataType,
    DropboxProvider | GoogleProvider | FileSystemProvider | undefined
> = {
    labels: undefined,
};
const fetchIntervals: { [deviceState: string]: any } = {}; // any because of native at the moment, otherwise number | undefined

const createProviderInstance = (
    type: MetadataProvider['type'],
    tokens: Tokens = {},
    environment: OAuthServerEnvironment = 'production',
    clientId?: string,
) => {
    switch (type) {
        case 'dropbox':
            return new DropboxProvider({
                token: tokens?.refreshToken,
                clientId: clientId || METADATA.DROPBOX_CLIENT_ID,
            });
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
    const provider = selectSelectedProviderForLabels(getState());
    const devices = selectDevices(getState());

    if (!provider) {
        return;
    }

    dispatch({
        type: METADATA.SET_DATA,
        payload: {
            provider,
            data: undefined,
        },
    });

    if (keys) {
        getState().wallet.accounts.forEach(account => {
            const updatedAccount = JSON.parse(JSON.stringify(account));

            delete updatedAccount.metadata[METADATA.ENCRYPTION_VERSION];
            dispatch(setAccountAdd(updatedAccount));
        });

        devices.forEach(device => {
            if (device.state) {
                // set metadata as disabled for this device, remove all metadata related information
                dispatch({
                    type: METADATA.SET_DEVICE_METADATA,
                    payload: {
                        deviceState: device.state,
                        metadata: {},
                    },
                });
            }
        });
    }
};

export const disconnectProvider =
    ({
        clientId,
        dataType,
        removeMetadata = true,
    }: {
        clientId: string;
        dataType: DataType;
        removeMetadata?: boolean;
    }) =>
    async (dispatch: Dispatch) => {
        Object.values(fetchIntervals).forEach((deviceState, num) => {
            clearInterval(num);
            delete fetchIntervals[deviceState];
        });

        // dispose metadata values (not keys)
        if (removeMetadata) {
            dispatch(disposeMetadata());
        }

        /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
        const provider = dispatch(getProviderInstance({ clientId, dataType }));

        if (provider) {
            await provider.disconnect();
            providerInstance[dataType] = undefined;
        }
        // flush reducer
        dispatch({
            type: METADATA.REMOVE_PROVIDER,
            payload: provider,
        });
        dispatch({
            type: METADATA.SET_SELECTED_PROVIDER,
            payload: { dataType, clientId: undefined },
        });

        analytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: '',
            },
        });
    };

/**
 * handleProviderError method controls how application reacts to various errors from metadata providers
 * Toasts go in this format:
 * Error: <Action>: <Reason>
 * Error: Upload failed: Access token is invalid
 */
const handleProviderError =
    ({
        error,
        action,
        clientId,
    }: {
        error: MetadataProviderError;
        action: string;
        clientId?: string;
    }) =>
    (dispatch: Dispatch) => {
        // error should be of specified type, but in case it is not (catch is not typed) show generic error
        // if this happens, it means that there is a hole in error handling and it should be fixed
        const toastError = error.code
            ? `${action}: ${error?.error}`
            : `Labeling action failed. ${error}`;

        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: toastError,
            }),
        );

        if (clientId) {
            // handle nicely wrapped errors here
            switch (error.code) {
                // possibly programmer errors
                // something is screwed up, we don't really know what.
                // react by disabling all metadata and toasting error;
                case 'ACCESS_ERROR':
                case 'BAD_INPUT_ERROR':
                case 'OTHER_ERROR':
                    dispatch(disposeMetadata());
                    dispatch(
                        disconnectProvider({
                            clientId,
                            dataType: 'labels',
                        }),
                    );
                    break;
                case 'PROVIDER_ERROR':
                case 'RATE_LIMIT_ERROR':
                case 'AUTH_ERROR':
                    dispatch(
                        disconnectProvider({
                            clientId,
                            dataType: 'labels',
                        }),
                    );
                    break;
                case 'CONNECTIVITY_ERROR':
                default:
                    break;
            }
        }
    };

/**
 * Return already existing instance of AbstractProvider or recreate it from token;
 */
const getProviderInstance =
    ({ clientId, dataType = 'labels' }: { clientId: string; dataType: DataType }) =>
    (_dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const { providers } = state.metadata;

        const provider = providers.find(p => p.clientId === clientId);

        if (!provider) return;

        // instance already exists but user did not finish log in and decided to use another provider;
        if (providerInstance[dataType] && providerInstance[dataType]?.type !== provider.type) {
            providerInstance[dataType] = undefined;
        }

        if (providerInstance[dataType]) return providerInstance[dataType];

        providerInstance[dataType] = createProviderInstance(
            provider.type,
            provider.tokens,
            state.suite.settings.debug.oauthServerEnvironment,
            clientId,
        );

        return providerInstance[dataType];
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

const setMetadata =
    ({
        provider,
        fileName,
        data,
    }: {
        provider: MetadataProvider;
        fileName: string;
        data: WalletLabels | AccountLabels | undefined;
    }) =>
    (dispatch: Dispatch) => {
        dispatch({
            type: METADATA.SET_DATA,
            payload: {
                provider,
                data: {
                    [fileName]: data,
                },
            },
        });
    };

export const getLabelableEntities =
    (deviceState: string) => (_dispatch: Dispatch, getState: GetState) =>
        selectLabelableEntities(getState(), deviceState);

type LabelableEntity = ReturnType<ReturnType<typeof getLabelableEntities>>[number];

const fetchMetadata =
    ({
        provider,
        entity,
        encryptionVersion = METADATA.ENCRYPTION_VERSION,
    }: {
        provider: MetadataProvider;
        entity: LabelableEntity;
        encryptionVersion?: MetadataEncryptionVersion;
    }) =>
    async (dispatch: Dispatch) => {
        const dataType = 'labels';

        const providerInstance = dispatch(
            getProviderInstance({
                clientId: provider.clientId,
                dataType,
            }),
        );

        if (!providerInstance) {
            throw new Error('no provider instance');
        }

        const entityMetadata = entity[encryptionVersion];
        if (!entityMetadata) {
            throw new Error('trying to fetch entity without metadata');
        }

        const { fileName, aesKey } = entityMetadata;

        const response = await providerInstance.getFileContent(fileName);

        if (!response.success) {
            throw response;
        }

        if (!response.payload) {
            return undefined;
        }

        // we found associated metadata file for given account, decrypt it and return it
        const decryptedData = metadataUtils.decrypt(
            metadataUtils.arrayBufferToBuffer(response.payload),
            aesKey,
        );

        // validation of fetched data structure. in theory, user may save any data in metadata file (although it is very unlikely)
        // so we should make sure that it at least matches AccountLabels types
        if (entity.type === 'account') {
            if (!decryptedData.addressLabels) {
                console.error('fetchMetadata: addressLabels missing in metadata file');
                decryptedData.addressLabels = {};
            }
            if (!decryptedData.outputLabels) {
                console.error('fetchMetadata: outputLabels missing in metadata file');
                decryptedData.outputLabels = {};
            }
        }

        return {
            fileName,
            data: decryptedData,
        };
    };

export const setAccountMetadataKey =
    (account: Account, encryptionVersion = METADATA.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: GetState) => {
        const device = selectDeviceByState(getState(), account.deviceState);
        const deviceMetaKey = device?.metadata[encryptionVersion]?.key;

        if (!deviceMetaKey) {
            // account keys can't be set without device keys
            return account;
        }
        try {
            const metaKey = metadataUtils.deriveMetadataKey(deviceMetaKey, account.metadata.key);
            const fileName = metadataUtils.deriveFilenameForLabeling(metaKey, encryptionVersion);

            const aesKey = metadataUtils.deriveAesKey(metaKey);
            return {
                ...account,
                metadata: {
                    ...account.metadata,
                    [encryptionVersion]: { fileName, aesKey },
                },
            };
        } catch (error) {
            dispatch(handleProviderError({ error, action: ProviderErrorAction.SAVE }));
        }
        return account;
    };

/**
 * Fill any record in reducer that may have metadata with metadata keys (not values).
 */
const syncMetadataKeys =
    (device: TrezorDevice, encryptionVersion = METADATA.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: GetState) => {
        if (!device.metadata[METADATA.ENCRYPTION_VERSION]) {
            return;
        }
        const targetAccounts = getState().wallet.accounts.filter(
            acc => !acc.metadata[encryptionVersion]?.fileName && acc.deviceState === device.state,
        );

        targetAccounts.forEach(account => {
            const accountWithMetadata = dispatch(setAccountMetadataKey(account, encryptionVersion));
            dispatch(setAccountAdd(accountWithMetadata));
        });
        // note that devices are intentionally omitted here - device receives metadata
        // keys sooner when enabling labeling on device;
    };

export const fetchAndSaveMetadata =
    (deviceStateArg?: string) => async (dispatch: Dispatch, getState: GetState) => {
        const provider = selectSelectedProviderForLabels(getState());
        if (!provider) return;

        let device = deviceStateArg
            ? selectDeviceByState(getState(), deviceStateArg)
            : selectDevice(getState());

        if (!device?.state || !device?.metadata?.[METADATA.ENCRYPTION_VERSION]) return;

        const providerInstance = dispatch(
            getProviderInstance({
                clientId: provider.clientId,
                dataType: 'labels',
            }),
        );
        if (!providerInstance) {
            return;
        }

        try {
            // this triggers renewal of access token if needed. Otherwise multiple requests
            // to renew access token are issued by every provider.getFileContent
            const response = await providerInstance.getProviderDetails();

            device = deviceStateArg
                ? selectDeviceByState(getState(), deviceStateArg)
                : selectDevice(getState());
            if (!device?.state || !device?.metadata?.[METADATA.ENCRYPTION_VERSION]) return;

            dispatch(syncMetadataKeys(device));

            if (!response.success) {
                dispatch(
                    handleProviderError({
                        error: response,
                        action: ProviderErrorAction.LOAD,
                        clientId: provider.clientId,
                    }),
                );

                return;
            }

            // device is disconnected or something is wrong with it
            if (!device?.metadata?.[METADATA.ENCRYPTION_VERSION]) {
                if (fetchIntervals[device.state]) {
                    clearInterval(fetchIntervals[device.state]);
                    delete fetchIntervals[device.state];
                }

                return;
            }

            const labelableEntities = dispatch(getLabelableEntities(device.state));
            const promises = labelableEntities.map(entity =>
                dispatch(fetchMetadata({ provider, entity })).then(result => {
                    if (result) {
                        dispatch(setMetadata({ ...result, provider }));
                    }
                }),
            );
            await Promise.all(promises);
        } catch (error) {
            // This handles cases of providers that do not support token renewal.
            // We want those to work normally as long as their short-lived token allows. And only if
            // it expires, we want them to silently disconnect provider, keep metadata in place.
            // So that users will not notice that token expired until they will try to add or edit
            // already existing label
            if (device?.state && fetchIntervals[device.state]) {
                return dispatch(
                    disconnectProvider({
                        removeMetadata: false,
                        dataType: 'labels',
                        clientId: provider.clientId,
                    }),
                );
            }
            // If there is no interval set, it means that error occurred in the first fetch
            // in such case, display error notification
            dispatch(
                handleProviderError({
                    error,
                    action: ProviderErrorAction.LOAD,
                    clientId: provider.clientId,
                }),
            );
        }
    };

export const fetchAndSaveMetadataForAllDevices = () => (dispatch: Dispatch, getState: GetState) => {
    const metadata = selectMetadata(getState());
    if (!metadata.enabled) {
        return;
    }
    const devices = selectDevices(getState());
    devices.forEach(device => {
        if (!device.state || !device.metadata[METADATA.ENCRYPTION_VERSION]) return;
        dispatch(fetchAndSaveMetadata(device.state));
    });
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
        dataType = 'labels',
        clientId,
    }: {
        type: MetadataProviderType;
        dataType?: DataType;
        clientId?: string;
    }) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const providerInstance = createProviderInstance(
            type,
            {},
            getState().suite.settings.debug.oauthServerEnvironment,
            clientId,
        );

        const isConnected = await providerInstance.isConnected();
        if (!isConnected) {
            const connectionResult = await providerInstance.connect();
            if ('error' in connectionResult) {
                return connectionResult.error;
            }
        }

        const providerDetails = await providerInstance.getProviderDetails();
        if (!providerDetails.success) {
            dispatch(
                handleProviderError({
                    error: providerDetails,
                    action: ProviderErrorAction.CONNECT,
                    clientId: providerInstance.clientId,
                }),
            );
            return;
        }

        dispatch({
            type: METADATA.ADD_PROVIDER,
            payload: {
                ...providerDetails.payload,
                data: {},
            },
        });

        analytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: providerDetails.payload.type,
            },
        });

        dispatch(selectProvider({ dataType, clientId: providerInstance.clientId }));

        return true;
    };

const encryptAndSaveMetadata =
    ({
        data,
        aesKey,
        fileName,
        provider,
    }: {
        data: AccountLabels | WalletLabels;
        aesKey: string;
        fileName: string;
        provider: MetadataProvider;
    }) =>
    async (dispatch: Dispatch) => {
        const providerInstance = dispatch(
            getProviderInstance({ clientId: provider.clientId, dataType: 'labels' }),
        );

        if (!providerInstance) {
            // provider should always be set here
            return Promise.resolve({ success: false, error: 'no provider instance' });
        }

        const encrypted = await metadataUtils.encrypt(
            {
                version: METADATA.FORMAT_VERSION,
                ...data,
            },
            aesKey,
        );

        return providerInstance.setFileContent(fileName, encrypted);
    };

export const addDeviceMetadata =
    (payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: GetState) => {
        const devices = selectDevices(getState());
        const device = devices.find(d => d.state === payload.entityKey);
        const provider = selectSelectedProviderForLabels(getState());

        if (!provider)
            return Promise.resolve({
                success: false,
                error: 'provider missing',
            });

        const { fileName, aesKey } = device?.metadata[METADATA.ENCRYPTION_VERSION] || {};
        if (!fileName || !aesKey) {
            return Promise.resolve({
                success: false,
                error: `fileName or aesKey is missing for device ${device?.state}`,
            });
        }

        // todo: not danger overwrite empty?
        const metadata = fileName ? provider.data[fileName] : undefined;

        const nextMetadata = cloneObject(
            metadata ?? METADATA.DEFAULT_WALLET_METADATA,
        ) as WalletLabels;

        const walletLabel =
            typeof payload.value === 'string' && payload.value.length > 0
                ? payload.value
                : undefined;

        nextMetadata.walletLabel = walletLabel;

        dispatch(
            setMetadata({
                provider,
                fileName,
                data: nextMetadata,
            }),
        );

        return dispatch(
            encryptAndSaveMetadata({
                data: { walletLabel },
                aesKey,
                fileName,

                provider,
            }),
        );
    };

/**
 * @param payload - metadata payload
 * @param save - should metadata be saved into persistent storage? this is useful when you are updating multiple records
 *               in a single account you may want to set "save" param to true only for the last call
 */
export const addAccountMetadata =
    (payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>, save = true) =>
    (dispatch: Dispatch, getState: GetState) => {
        const account = getState().wallet.accounts.find(a => a.key === payload.entityKey);
        const provider = selectSelectedProviderForLabels(getState());

        if (!account || !provider)
            return Promise.resolve({ success: false, error: 'account or provider missing' });

        // todo: not danger overwrite empty?
        const { fileName, aesKey } = account.metadata?.[METADATA.ENCRYPTION_VERSION] || {};

        if (!fileName || !aesKey) {
            return Promise.resolve({
                success: false,
                error: `filename of version ${METADATA.ENCRYPTION_VERSION} does not exist for account ${account.path}`,
            });
        }
        const data = provider.data[fileName];

        const nextMetadata = cloneObject(
            data ?? METADATA.DEFAULT_ACCOUNT_METADATA,
        ) as AccountLabels;

        if (payload.type === 'outputLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                if (!nextMetadata.outputLabels[payload.txid])
                    return Promise.resolve({ success: false });
                delete nextMetadata.outputLabels[payload.txid][payload.outputIndex];
                if (Object.keys(nextMetadata.outputLabels[payload.txid]).length === 0) {
                    delete nextMetadata.outputLabels[payload.txid];
                }
            } else {
                if (!nextMetadata.outputLabels[payload.txid]) {
                    nextMetadata.outputLabels[payload.txid] = {};
                }

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

        dispatch(
            setMetadata({
                fileName,
                provider,
                data: nextMetadata,
            }),
        );

        // we might intentionally skip saving metadata content to persistent storage.
        if (!save) return Promise.resolve({ success: true });

        return dispatch(
            encryptAndSaveMetadata({
                data: {
                    accountLabel: nextMetadata.accountLabel,
                    outputLabels: nextMetadata.outputLabels,
                    addressLabels: nextMetadata.addressLabels,
                },
                aesKey,
                fileName,
                provider,
            }),
        );
    };

/**
 * Generate device master-key
 * */
export const setDeviceMetadataKey =
    (device: TrezorDevice, encryptionVersion = METADATA.ENCRYPTION_VERSION) =>
    async (dispatch: Dispatch, getState: GetState) => {
        if (!device.state || !device.connected) return;

        const result = await TrezorConnect.cipherKeyValue({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            ...METADATA.ENCRYPTION_VERSION_CONFIGS[encryptionVersion],
        });

        if (result.success) {
            if (!getState().metadata.enabled) {
                dispatch({
                    type: METADATA.ENABLE,
                });
            }

            const [stateAddress] = device.state.split('@'); // address@device_id:instance
            const metaKey = metadataUtils.deriveMetadataKey(result.payload.value, stateAddress);
            const fileName = metadataUtils.deriveFilenameForLabeling(metaKey, encryptionVersion);
            const aesKey = metadataUtils.deriveAesKey(metaKey);

            dispatch({
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: device.state,
                    metadata: {
                        ...device.metadata,
                        [encryptionVersion]: {
                            fileName,
                            aesKey,
                            key: result.payload.value,
                        },
                    },
                },
            });

            return { success: true };
        }

        return { success: false };
    };

export const addMetadata =
    (payload: MetadataAddPayload) => (dispatch: Dispatch, getState: GetState) =>
        (payload.type === 'walletLabel'
            ? dispatch(addDeviceMetadata(payload))
            : dispatch(addAccountMetadata(payload))
        ).then(result => {
            if (!result.success) {
                if ('code' in result) {
                    dispatch(
                        handleProviderError({
                            error: result,
                            action: ProviderErrorAction.SAVE,
                            clientId: selectSelectedProviderForLabels(getState())!.clientId,
                        }),
                    );
                } else {
                    const providerInstance = dispatch(
                        getProviderInstance({
                            clientId: selectSelectedProviderForLabels(getState())!.clientId,
                            dataType: 'labels',
                        }),
                    );
                    if (providerInstance) {
                        dispatch(
                            handleProviderError({
                                error: providerInstance.error(
                                    'OTHER_ERROR',
                                    'error' in result ? result.error : '',
                                ),
                                action: ProviderErrorAction.SAVE,
                                clientId: selectSelectedProviderForLabels(getState())!.clientId,
                            }),
                        );
                    }
                }
            }

            return result.success;
        });

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
    (force: boolean, deviceState?: string) => async (dispatch: Dispatch, getState: GetState) => {
        let device = deviceState
            ? selectDeviceByState(getState(), deviceState)
            : selectDevice(getState());

        if (!device?.state) {
            return false;
        }

        if (!force && getState().metadata.error?.[device.state]) {
            return false;
        }

        dispatch({ type: METADATA.SET_INITIATING, payload: true });
        if (getState().metadata.error?.[device.state]) {
            // remove error note about failed migration potentially set in a previous run
            dispatch({
                type: METADATA.SET_ERROR_FOR_DEVICE,
                payload: {
                    deviceState: device.state,
                    failed: false,
                },
            });
        }

        // 1. set metadata enabled globally
        if (!getState().metadata.enabled) {
            dispatch(enableMetadata());
        }

        if (!device.metadata?.[METADATA.ENCRYPTION_VERSION]) {
            const result = await dispatch(
                setDeviceMetadataKey(device, METADATA.ENCRYPTION_VERSION),
            );
            if (!result?.success) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                dispatch({
                    type: METADATA.SET_ERROR_FOR_DEVICE,
                    payload: {
                        deviceState: device.state!,
                        failed: true,
                    },
                });
                return false;
            }
        }

        // 3. we have master key. use it to derive account keys
        dispatch(syncMetadataKeys(device, METADATA.ENCRYPTION_VERSION));

        device = deviceState
            ? selectDeviceByState(getState(), deviceState)
            : selectDevice(getState());

        if (!device) return false;

        // 4. connect to provider
        if (!selectSelectedProviderForLabels(getState())) {
            const providerResult = await dispatch(initProvider());
            if (!providerResult) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                return false;
            }
        }

        // todo: 5. migration

        // 6. fetch metadata
        await dispatch(fetchAndSaveMetadata(device.state));

        // now we may allow user to edit labels. everything is ready, local data is synced with provider
        if (getState().metadata.initiating) {
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
        }

        // 7. if interval for watching provider is not set, create it
        if (device.state && !fetchIntervals[device.state]) {
            // todo: possible race condition that has been around since always
            // user is editing label and at that very moment update arrives. updates to specific entities should be probably discarded in such case?
            fetchIntervals[device.state] = setInterval(() => {
                const device = selectDevice(getState());
                if (!getState().suite.online || !device?.state) {
                    return;
                }
                dispatch(fetchAndSaveMetadata(device.state));
            }, METADATA.FETCH_INTERVAL);
        }

        return true;
    };

export const setEditing = (payload: string | undefined): MetadataAction => ({
    type: METADATA.SET_EDITING,
    payload,
});
