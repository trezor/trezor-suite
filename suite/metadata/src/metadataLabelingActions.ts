import { type Dispatch } from '@reduxjs/toolkit';

import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import {
    selectDeviceByStaticSessionId,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type AccountLabels,
    type MetadataAddPayload,
    type Error as MetadataProviderError,
    ProviderErrorAction,
    type WalletLabels,
} from '@suite-common/metadata-types';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { cloneObject } from '@trezor/utils';

import { fetchAndSaveMetadata } from './fetchAndSaveMetadata';
import type { MetadataAction } from './metadataActions';
import * as metadataActions from './metadataActions';
import * as METADATA from './metadataConstants';
import * as metadataDataThunks from './metadataDataThunks';
import * as METADATA_LABELING from './metadataLabelingConstants';
import * as metadataProviderActions from './metadataProviderThunks';
import {
    type MetadataRootState,
    selectMetadata,
    selectSelectedProviderForLabels,
} from './metadataReducer';
import * as metadataUtils from './metadataUtils';
import { syncMetadataKeys } from './syncMetadataKeys';

export const setAccountMetadataKey =
    (account: Account, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: () => MetadataRootState) => {
        const device = selectDeviceByStaticSessionId(getState(), account.deviceState);
        const deviceMetaKey = device?.metadata[encryptionVersion]?.key;

        if (!deviceMetaKey) {
            // account keys can't be set without device keys
            return account;
        }
        try {
            return metadataUtils.getAccountWithMetadataKey(
                account,
                deviceMetaKey,
                encryptionVersion,
            );
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

export const fetchAndSaveMetadataForAllDevices =
    () => (dispatch: Dispatch, getState: () => MetadataRootState) => {
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
            dispatch(fetchAndSaveMetadata(device.state.staticSessionId));
        });
    };

export const addDeviceMetadata =
    (payload: Extract<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: () => MetadataRootState) => {
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
            metadataProviderActions.getProviderInstance({
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

/**
 * @param payload - metadata payload
 * @param save - should metadata be saved into persistent storage? this is useful when you are updating multiple records
 *               in a single account you may want to set "save" param to true only for the last call
 */
export const addAccountMetadata =
    (payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: () => MetadataRootState) => {
        const account = getState().wallet.accounts.find(a => a.key === payload.entityKey);
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
            metadataProviderActions.getProviderInstance({
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

/**
 * Generate device master-key
 * */
export const setDeviceMetadataKey =
    (device: TrezorDevice, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState) => {
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
            if (!getState().metadata.enabled) {
                dispatch({
                    type: METADATA.ENABLE,
                });
            }

            const { walletDescriptor } = parseStaticSessionId(device.state.staticSessionId);
            const metaKey = metadataUtils.deriveMetadataKey(result.payload.value, walletDescriptor);
            const fileName = metadataUtils.deriveFilenameForLabeling(metaKey, encryptionVersion);
            const aesKey = metadataUtils.deriveAesKey(metaKey);

            dispatch({
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: device.state?.staticSessionId,
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
    (payload: MetadataAddPayload) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState): Promise<boolean> => {
        const result = await dispatch(
            payload.type === 'walletLabel'
                ? addDeviceMetadata(payload)
                : addAccountMetadata(payload),
        );

        if (!result.success) {
            const provider = selectSelectedProviderForLabels(getState());

            const getErrorFromUnsuccessfulResult = (): MetadataProviderError => {
                // error from provider
                if ('code' in result) return result;

                // unknown error, need to generate a custom one from the provider instance
                if (provider !== undefined) {
                    const providerInstance = dispatch(
                        metadataProviderActions.getProviderInstance({
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
    (force: boolean, deviceStateArg?: StaticSessionId) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState, extra: ExtraDependencies) => {
        let device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device?.state?.staticSessionId) {
            return false;
        }

        if (!force && getState().metadata.error?.[device.state.staticSessionId]) {
            return false;
        }

        dispatch({ type: METADATA.SET_INITIATING, payload: true });
        if (getState().metadata.error?.[device.state.staticSessionId]) {
            // remove error note about failed migration potentially set in a previous run
            dispatch({
                type: METADATA.SET_ERROR_FOR_DEVICE,
                payload: {
                    deviceState: device.state.staticSessionId,
                    failed: false,
                },
            });
        }

        // 1. set metadata enabled globally
        const globalLabelingEnabledBeforeToggle = getState().metadata.enabled;
        if (!globalLabelingEnabledBeforeToggle) {
            dispatch(metadataActions.enableMetadata());
        }

        if (!device.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]) {
            const result = await dispatch(
                setDeviceMetadataKey(device, METADATA_LABELING.ENCRYPTION_VERSION),
            );
            if (!result?.success) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                dispatch({
                    type: METADATA.SET_ERROR_FOR_DEVICE,
                    payload: {
                        deviceState: device.state.staticSessionId,
                        failed: true,
                    },
                });

                // NOTE: when the request for the device fails / is cancelled on the device
                // disable metadata labeling for all but only when it was off before this invocation
                if (!globalLabelingEnabledBeforeToggle) {
                    dispatch(metadataDataThunks.disableMetadata());
                }

                return false;
            }
        }

        // 3. we have master key. use it to derive account keys
        dispatch(syncMetadataKeys(device, METADATA_LABELING.ENCRYPTION_VERSION));

        device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!device) return false;

        // 4. connect to provider
        if (!selectSelectedProviderForLabels(getState())) {
            const providerResult = await dispatch(metadataProviderActions.initProvider());
            if (!providerResult) {
                asTypedDesktopAnalytics(extra.services.analytics).report({
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
        await dispatch(fetchAndSaveMetadata(device.state?.staticSessionId));

        // now we may allow user to edit labels. everything is ready, local data is synced with provider
        if (getState().metadata.initiating) {
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
                if (!getState().suite.online || !device?.state?.staticSessionId) {
                    return;
                }
                dispatch(fetchAndSaveMetadata(device.state.staticSessionId));
            }, METADATA_LABELING.FETCH_INTERVAL);
        }

        return true;
    };

export const setEditing = (payload: string | undefined): MetadataAction => ({
    type: METADATA.SET_EDITING,
    payload,
});
