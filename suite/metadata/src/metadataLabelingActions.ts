import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import {
    selectDeviceByStaticSessionId,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type AccountLabels,
    type MetadataAddPayload,
    type MetadataEncryptionVersion,
    type MetadataProvider,
    type Error as MetadataProviderError,
    ProviderErrorAction,
    type WalletLabels,
} from '@suite-common/metadata-types';
import { type Dispatch, type WithServices } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { cloneObject, throwError } from '@trezor/utils';

import * as metadataActions from './metadataActions';
import * as METADATA from './metadataConstants';
import * as metadataDataThunks from './metadataDataThunks';
import * as METADATA_LABELING from './metadataLabelingConstants';
import * as metadataProviderActions from './metadataProviderThunks';
import {
    type MetadataRootState,
    selectLabelableEntities,
    selectMetadata,
    selectMetadataEnabled,
    selectMetadataError,
    selectMetadataInitiating,
    selectSelectedProviderForLabels,
} from './metadataReducer';
import * as metadataUtils from './metadataUtils';

type GetLabelableEntitiesThunkState = MetadataRootState;

const getLabelableEntitiesThunk =
    (deviceState: StaticSessionId) =>
    (_dispatch: Dispatch, getState: () => GetLabelableEntitiesThunkState) =>
        selectLabelableEntities(getState(), deviceState);

type LabelableEntity = ReturnType<ReturnType<typeof getLabelableEntitiesThunk>>[number];

const fetchMetadata =
    ({
        provider,
        entity,
        encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION,
    }: {
        provider: MetadataProvider;
        entity: LabelableEntity;
        encryptionVersion?: MetadataEncryptionVersion;
    }) =>
    async (dispatch: Dispatch) => {
        const dataType = 'labels';

        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstanceThunk({
                clientId: provider.clientId,
                dataType,
            }),
        );

        if (!providerInstance) {
            throw new Error('no provider instance');
        }

        const { fileName, aesKey } =
            entity[encryptionVersion] ?? throwError('trying to fetch entity without metadata');

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

type SetAccountMetadataKeyThunkState = MetadataRootState;

export const setAccountMetadataKeyThunk =
    (account: Account, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: () => SetAccountMetadataKeyThunkState) => {
        const device = selectDeviceByStaticSessionId(getState(), account.deviceState);
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

type SyncMetadataKeysThunkState = MetadataRootState;

/**
 * Fill any record in reducer that may have metadata with metadata keys (not values).
 */
const syncMetadataKeysThunk =
    (device: TrezorDevice, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: () => SyncMetadataKeysThunkState) => {
        if (!device.metadata[METADATA_LABELING.ENCRYPTION_VERSION]) {
            return;
        }
        const targetAccounts = selectAccounts(getState()).filter(
            acc =>
                !acc.metadata[encryptionVersion]?.fileName &&
                acc.deviceState === device.state?.staticSessionId,
        );

        targetAccounts.forEach(account => {
            const accountWithMetadata = dispatch(
                setAccountMetadataKeyThunk(account, encryptionVersion),
            );
            dispatch(metadataActions.setAccountAdd(accountWithMetadata));
        });
        // note that devices are intentionally omitted here - device receives metadata
        // keys sooner when enabling labeling on device;
    };

type FetchAndSaveMetadataThunkState = MetadataRootState;

export const fetchAndSaveMetadataThunk =
    (deviceStateArg?: StaticSessionId) =>
    async (dispatch: Dispatch, getState: () => FetchAndSaveMetadataThunkState) => {
        const provider = selectSelectedProviderForLabels(getState());
        if (!provider) return;

        let device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (
            !device?.state?.staticSessionId ||
            !device?.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]
        )
            return;

        const fetchIntervalTrackingId = metadataUtils.getFetchTrackingId(
            'labels',
            provider.clientId,
            device.state.staticSessionId,
        );

        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstanceThunk({
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
                ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
                : selectSelectedDevice(getState());
            if (
                !device?.state?.staticSessionId ||
                !device?.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]
            )
                return;

            dispatch(syncMetadataKeysThunk(device));

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
            if (!device?.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]) {
                if (metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
                    clearInterval(metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]);
                    delete metadataProviderActions.fetchIntervals[fetchIntervalTrackingId];
                }

                return;
            }

            const labelableEntities = dispatch(
                getLabelableEntitiesThunk(device.state.staticSessionId),
            );
            const promises = labelableEntities.map(entity =>
                dispatch(fetchMetadata({ provider, entity })).then(result => {
                    if (result) {
                        dispatch(metadataDataThunks.setMetadata({ ...result, provider }));
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
            if (device?.state && metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
                return dispatch(
                    metadataProviderActions.disconnectProviderThunk({
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

type FetchAndSaveMetadataForAllDevicesThunkState = MetadataRootState;

export const fetchAndSaveMetadataForAllDevicesThunk =
    () => (dispatch: Dispatch, getState: () => FetchAndSaveMetadataForAllDevicesThunkState) => {
        const metadata = selectMetadata(getState());
        if (!metadata.enabled) {
            return;
        }
        const devices = selectDevices(getState());
        devices.forEach(device => {
            if (
                !device.state?.staticSessionId ||
                !device.metadata[METADATA_LABELING.ENCRYPTION_VERSION]
            )
                return;
            dispatch(fetchAndSaveMetadataThunk(device.state.staticSessionId));
        });
    };

type AddDeviceMetadataThunkState = MetadataRootState;

export const addDeviceMetadataThunk =
    (payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: () => AddDeviceMetadataThunkState) => {
        const devices = selectDevices(getState());
        const device = devices.find(d => d.state?.staticSessionId === payload.entityKey);
        const provider = selectSelectedProviderForLabels(getState());

        if (!provider)
            return Promise.resolve({
                success: false as const,
                error: 'provider missing',
            });

        const { fileName, aesKey } = device?.metadata[METADATA_LABELING.ENCRYPTION_VERSION] || {};
        if (!fileName || !aesKey) {
            return Promise.resolve({
                success: false as const,
                error: `fileName or aesKey is missing for device ${device?.state}`,
            });
        }

        // todo: not danger overwrite empty?
        const metadata = fileName ? provider.data[fileName] : undefined;

        const nextMetadata = cloneObject(
            metadata ?? METADATA_LABELING.DEFAULT_WALLET_METADATA,
        ) as WalletLabels;

        const walletLabel =
            typeof payload.value === 'string' && payload.value.length > 0
                ? payload.value
                : undefined;

        nextMetadata.walletLabel = walletLabel;

        dispatch(
            metadataDataThunks.setMetadata({
                provider,
                fileName,
                data: nextMetadata,
            }),
        );

        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstanceThunk({
                clientId: provider.clientId,
                dataType: 'labels',
            }),
        );
        if (!providerInstance) {
            // provider should always be set here
            return Promise.resolve({ success: false as const, error: 'no provider instance' });
        }

        return metadataDataThunks.encryptAndSaveMetadata({
            data: { walletLabel },
            aesKey,
            fileName,
            providerInstance,
        });
    };

type AddAccountMetadataThunkState = MetadataRootState;

/**
 * @param payload - metadata payload
 * @param save - should metadata be saved into persistent storage? this is useful when you are updating multiple records
 *               in a single account you may want to set "save" param to true only for the last call
 */
export const addAccountMetadataThunk =
    (payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: () => AddAccountMetadataThunkState) => {
        const account = selectAccounts(getState()).find(({ key }) => key === payload.entityKey);
        const provider = selectSelectedProviderForLabels(getState());

        if (!account || !provider) {
            return Promise.resolve({
                success: false as const,
                error: 'account or provider missing',
            });
        }

        // todo: not danger overwrite empty?
        const { fileName, aesKey } = account.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION] || {};

        if (!fileName || !aesKey) {
            return Promise.resolve({
                success: false as const,
                error: `filename of version ${METADATA_LABELING.ENCRYPTION_VERSION} does not exist for account ${account.path}`,
            });
        }
        const data = provider.data[fileName];

        const nextMetadata = cloneObject(
            data ?? METADATA_LABELING.DEFAULT_ACCOUNT_METADATA,
        ) as AccountLabels;

        if (payload.type === 'outputLabel') {
            if (typeof payload.value !== 'string' || payload.value.length === 0) {
                const outputLabelsForTxid = nextMetadata.outputLabels[payload.txid];
                if (!outputLabelsForTxid) {
                    // If we try to delete already deleted label it's ok.
                    // No problem happened. ¯\_ (ツ)_/¯

                    return Promise.resolve({ success: true as const });
                }

                delete outputLabelsForTxid[payload.outputIndex];
                if (Object.keys(outputLabelsForTxid).length === 0) {
                    delete nextMetadata.outputLabels[payload.txid];
                }
            } else {
                if (!nextMetadata.outputLabels[payload.txid]) {
                    nextMetadata.outputLabels[payload.txid] = {};
                }

                const txidLabels = nextMetadata.outputLabels[payload.txid];
                if (txidLabels) {
                    txidLabels[payload.outputIndex] = payload.value;
                }

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
            metadataDataThunks.setMetadata({
                fileName,
                provider,
                data: nextMetadata,
            }),
        );

        // we might intentionally skip saving metadata content to persistent storage.
        if (payload.skipSave) {
            return Promise.resolve({ success: true as const });
        }

        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstanceThunk({
                clientId: provider.clientId,
                dataType: 'labels',
            }),
        );
        if (!providerInstance) {
            // provider should always be set here
            return Promise.resolve({ success: false as const, error: 'no provider instance' });
        }

        return metadataDataThunks.encryptAndSaveMetadata({
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

type SetDeviceMetadataKeyThunkState = MetadataRootState;

/**
 * Generate device master-key
 * */
export const setDeviceMetadataKeyThunk =
    (device: TrezorDevice, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    async (dispatch: Dispatch, getState: () => SetDeviceMetadataKeyThunkState) => {
        if (!device.state?.staticSessionId || !device.connected) return;

        const result = await TrezorConnect.cipherKeyValue({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            ...METADATA_LABELING.ENCRYPTION_VERSION_CONFIGS[encryptionVersion],
        });

        if (result.success) {
            if (!selectMetadataEnabled(getState())) {
                dispatch(metadataActions.enableMetadata());
            }

            const { walletDescriptor } = parseStaticSessionId(device.state.staticSessionId);
            const metaKey = metadataUtils.deriveMetadataKey(result.payload.value, walletDescriptor);
            const fileName = metadataUtils.deriveFilenameForLabeling(metaKey, encryptionVersion);
            const aesKey = metadataUtils.deriveAesKey(metaKey);

            dispatch(
                metadataActions.setDeviceMetadata({
                    deviceState: device.state?.staticSessionId,
                    metadata: {
                        ...device.metadata,
                        [encryptionVersion]: {
                            fileName,
                            aesKey,
                            key: result.payload.value,
                        },
                    },
                }),
            );

            return { success: true };
        }

        return { success: false };
    };

type AddMetadataThunkState = MetadataRootState;

export const addMetadataThunk =
    (payload: MetadataAddPayload) =>
    async (dispatch: Dispatch, getState: () => AddMetadataThunkState): Promise<boolean> => {
        const result = await dispatch(
            payload.type === 'walletLabel'
                ? addDeviceMetadataThunk(payload)
                : addAccountMetadataThunk(payload),
        );

        if (!result.success) {
            const provider = selectSelectedProviderForLabels(getState());

            const getErrorFromUnsuccessfulResult = (): MetadataProviderError => {
                // error from provider
                if ('code' in result) return result;

                // unknown error, need to generate a custom one from the provider instance
                if (provider !== undefined) {
                    const providerInstance = dispatch(
                        metadataProviderActions.getProviderInstanceThunk({
                            clientId: provider.clientId,
                            dataType: 'labels',
                        }),
                    );
                    if (providerInstance) {
                        const reason = 'error' in result ? result.error : '';

                        return providerInstance.error('OTHER_ERROR', reason);
                    }
                }

                // no provider, or not possible to get its instance
                return { ...result, code: 'OTHER_ERROR' };
            };

            dispatch(
                metadataProviderActions.handleProviderError({
                    error: getErrorFromUnsuccessfulResult(),
                    action: ProviderErrorAction.SAVE,
                    clientId: provider?.clientId,
                }),
            );
        }

        return result.success;
    };

export type InitMetadataDeps = WithServices<DesktopAnalyticsDep>;

const selectIsSuiteOnline = (state: MetadataRootState) => state.suite.online;

/**
 * init - prepare everything needed to load + decrypt and upload + decrypt metadata. Note that this method
 * consists of number of steps of which not all have to necessarily happen. For example
 * user may directly navigate to /settings, enable metadata (by invoking init), but his device
 * does not have state yet.
 * In this case, setDeviceMetadataKey method and those that follow
 * are skipped and user will be asked again either after authorization process or when user
 * tries to add new label.
 */
type InitThunkState = MetadataRootState;

type InitThunkDeps = InitMetadataDeps;

export const initThunk =
    (force: boolean, deviceStateArg?: StaticSessionId) =>
    async (dispatch: Dispatch, getState: () => InitThunkState, extra: InitThunkDeps) => {
        let device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId) {
            return false;
        }

        if (!force && selectMetadataError(getState())?.[device.state.staticSessionId]) {
            return false;
        }

        dispatch({ type: METADATA.SET_INITIATING, payload: true });
        if (selectMetadataError(getState())?.[device.state.staticSessionId]) {
            // remove error note about failed migration potentially set in a previous run
            dispatch(
                metadataActions.setErrorForDevice({
                    deviceState: device.state.staticSessionId,
                    failed: false,
                }),
            );
        }

        // 1. set metadata enabled globally
        const globalLabelingEnabledBeforeToggle = selectMetadataEnabled(getState());
        if (!globalLabelingEnabledBeforeToggle) {
            dispatch(metadataActions.enableMetadata());
        }

        if (!device.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]) {
            const result = await dispatch(
                setDeviceMetadataKeyThunk(device, METADATA_LABELING.ENCRYPTION_VERSION),
            );
            if (!result?.success) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                dispatch(
                    metadataActions.setErrorForDevice({
                        deviceState: device.state.staticSessionId,
                        failed: true,
                    }),
                );

                // NOTE: when the request for the device fails / is cancelled on the device
                // disable metadata labeling for all but only when it was off before this invocation
                if (!globalLabelingEnabledBeforeToggle) {
                    dispatch(metadataDataThunks.disableMetadata());
                }

                return false;
            }
        }

        // 3. we have master key. use it to derive account keys
        dispatch(syncMetadataKeysThunk(device, METADATA_LABELING.ENCRYPTION_VERSION));

        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device) return false;

        // 4. connect to provider
        if (!selectSelectedProviderForLabels(getState())) {
            const providerResult = await dispatch(metadataProviderActions.initProvider());
            if (!providerResult) {
                extra.services.analytics.report({
                    type: events.settingsGeneralLabelingProviderEvent.name,
                    payload: {
                        provider: 'missing-provider',
                    },
                });

                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                // NOTE: when the provider is not initialized
                // disable metadata labeling for all but only when it was off before this invocation
                if (!globalLabelingEnabledBeforeToggle) {
                    dispatch(metadataDataThunks.disableMetadata());
                }

                return false;
            }
        }

        // todo: 5. migration

        // 6. fetch metadata
        await dispatch(fetchAndSaveMetadataThunk(device.state?.staticSessionId));

        // now we may allow user to edit labels. everything is ready, local data is synced with provider
        if (selectMetadataInitiating(getState())) {
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
        }

        const selectedProvider = selectSelectedProviderForLabels(getState());
        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId || !selectedProvider) {
            return true;
        }

        const fetchIntervalTrackingId = metadataUtils.getFetchTrackingId(
            'labels',
            selectedProvider.clientId,
            device.state.staticSessionId,
        );

        // 7. if interval for watching provider is not set, create it
        if (device.state && !metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
            // todo: possible race condition that has been around since always
            // user is editing label and at that very moment update arrives. updates to specific entities should be probably discarded in such case?
            metadataProviderActions.fetchIntervals[fetchIntervalTrackingId] = setInterval(() => {
                const device = selectSelectedDevice(getState());
                if (!selectIsSuiteOnline(getState()) || !device?.state?.staticSessionId) {
                    return;
                }
                dispatch(fetchAndSaveMetadataThunk(device.state.staticSessionId));
            }, METADATA_LABELING.FETCH_INTERVAL);
        }

        return true;
    };
