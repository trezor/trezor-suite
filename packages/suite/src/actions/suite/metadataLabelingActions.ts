import TrezorConnect from '@trezor/connect';
import { cloneObject } from '@trezor/utils';

import { selectDevices, selectDevice, selectDeviceByState } from '@suite-common/wallet-core';

import { METADATA } from 'src/actions/suite/constants';
import { Dispatch, GetState, TrezorDevice } from 'src/types/suite';
import {
    MetadataProvider,
    MetadataAddPayload,
    ProviderErrorAction,
    MetadataEncryptionVersion,
    WalletLabels,
    AccountLabels,
} from 'src/types/suite/metadata';
import { Account } from 'src/types/wallet';
import * as metadataUtils from 'src/utils/suite/metadata';
import {
    selectLabelableEntities,
    selectMetadata,
    selectSelectedProviderForLabels,
} from 'src/reducers/suite/metadataReducer';

import type { MetadataAction } from './metadataActions';
import * as metadataActions from './metadataActions';
import * as metadataProviderActions from './metadataProviderActions';

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
            metadataProviderActions.getProviderInstance({
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
            dispatch(
                metadataProviderActions.handleProviderError({
                    error,
                    action: ProviderErrorAction.SAVE,
                }),
            );
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
            dispatch(metadataActions.setAccountAdd(accountWithMetadata));
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
            metadataProviderActions.getProviderInstance({
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
                    metadataProviderActions.handleProviderError({
                        error: response,
                        action: ProviderErrorAction.LOAD,
                        clientId: provider.clientId,
                    }),
                );

                return;
            }

            // device is disconnected or something is wrong with it
            if (!device?.metadata?.[METADATA.ENCRYPTION_VERSION]) {
                if (metadataProviderActions.fetchIntervals[device.state]) {
                    clearInterval(metadataProviderActions.fetchIntervals[device.state]);
                    delete metadataProviderActions.fetchIntervals[device.state];
                }

                return;
            }

            const labelableEntities = dispatch(getLabelableEntities(device.state));
            const promises = labelableEntities.map(entity =>
                dispatch(fetchMetadata({ provider, entity })).then(result => {
                    if (result) {
                        dispatch(metadataActions.setMetadata({ ...result, provider }));
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
            if (device?.state && metadataProviderActions.fetchIntervals[device.state]) {
                return dispatch(
                    metadataProviderActions.disconnectProvider({
                        removeMetadata: false,
                        dataType: 'labels',
                        clientId: provider.clientId,
                    }),
                );
            }
            // If there is no interval set, it means that error occurred in the first fetch
            // in such case, display error notification
            dispatch(
                metadataProviderActions.handleProviderError({
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

export const addDeviceMetadata =
    (payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: GetState) => {
        const devices = selectDevices(getState());
        const device = devices.find(d => d.state === payload.entityKey);
        const provider = selectSelectedProviderForLabels(getState());

        if (!provider)
            return Promise.resolve({
                success: false as const,
                error: 'provider missing',
            });

        const { fileName, aesKey } = device?.metadata[METADATA.ENCRYPTION_VERSION] || {};
        if (!fileName || !aesKey) {
            return Promise.resolve({
                success: false as const,
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
            metadataActions.setMetadata({
                provider,
                fileName,
                data: nextMetadata,
            }),
        );

        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstance({
                clientId: selectSelectedProviderForLabels(getState())!.clientId,
                dataType: 'labels',
            }),
        );
        if (!providerInstance) {
            // provider should always be set here
            return Promise.resolve({ success: false as const, error: 'no provider instance' });
        }

        return metadataActions.encryptAndSaveMetadata({
            data: { walletLabel },
            aesKey,
            fileName,
            providerInstance,
        });
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

        if (!account || !provider) {
            return Promise.resolve({
                success: false as const,
                error: 'account or provider missing',
            });
        }

        // todo: not danger overwrite empty?
        const { fileName, aesKey } = account.metadata?.[METADATA.ENCRYPTION_VERSION] || {};

        if (!fileName || !aesKey) {
            return Promise.resolve({
                success: false as const,
                error: `filename of version ${METADATA.ENCRYPTION_VERSION} does not exist for account ${account.path}`,
            });
        }
        const data = provider.data[fileName];

        const nextMetadata = cloneObject(
            data ?? METADATA.DEFAULT_ACCOUNT_METADATA,
        ) as AccountLabels;

        if (payload.type === 'outputLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                if (!nextMetadata.outputLabels[payload.txid]) {
                    // If we try to delete already deleted label it's ok.
                    // No problem happened. ¯\_ (ツ)_/¯

                    return Promise.resolve({ success: true as const });
                }

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
            metadataActions.setMetadata({
                fileName,
                provider,
                data: nextMetadata,
            }),
        );

        // we might intentionally skip saving metadata content to persistent storage.
        if (!save) {
            return Promise.resolve({ success: true as const });
        }

        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstance({
                clientId: selectSelectedProviderForLabels(getState())!.clientId,
                dataType: 'labels',
            }),
        );
        if (!providerInstance) {
            // provider should always be set here
            return Promise.resolve({ success: false as const, error: 'no provider instance' });
        }

        return metadataActions.encryptAndSaveMetadata({
            data: {
                accountLabel: nextMetadata.accountLabel,
                outputLabels: nextMetadata.outputLabels,
                addressLabels: nextMetadata.addressLabels,
            },
            aesKey,
            fileName,
            providerInstance,
        });
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
                    console.log(result.code);
                    dispatch(
                        metadataProviderActions.handleProviderError({
                            error: result,
                            action: ProviderErrorAction.SAVE,
                            clientId: selectSelectedProviderForLabels(getState())!.clientId,
                        }),
                    );
                } else {
                    const providerInstance = dispatch(
                        metadataProviderActions.getProviderInstance({
                            clientId: selectSelectedProviderForLabels(getState())!.clientId,
                            dataType: 'labels',
                        }),
                    );
                    if (providerInstance) {
                        dispatch(
                            metadataProviderActions.handleProviderError({
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
            dispatch(metadataActions.enableMetadata());
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
            const providerResult = await dispatch(metadataProviderActions.initProvider());
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
        if (device.state && !metadataProviderActions.fetchIntervals[device.state]) {
            // todo: possible race condition that has been around since always
            // user is editing label and at that very moment update arrives. updates to specific entities should be probably discarded in such case?
            metadataProviderActions.fetchIntervals[device.state] = setInterval(() => {
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
