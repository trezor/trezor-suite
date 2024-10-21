import TrezorConnect from '@trezor/connect';
import {
    cloneObject,
    arrayPartition,
    getWeakRandomId,
    getRandomNumberInRange,
} from '@trezor/utils';

import { selectDevices, selectDevice, selectDeviceByState } from '@suite-common/wallet-core';
import * as notificationsActions from '@suite-common/toast-notifications';

import { METADATA, METADATA_LABELING } from 'src/actions/suite/constants';
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
    selectEncryptionVersion,
    selectLabelableEntities,
    selectMetadata,
    selectSelectedProviderForLabels,
} from 'src/reducers/suite/metadataReducer';

import type { MetadataAction } from './metadataActions';
import * as metadataActions from './metadataActions';
import * as metadataProviderActions from './metadataProviderActions';

type LabelableEntity = ReturnType<ReturnType<typeof getLabelableEntities>>[number];

export const getLabelableEntities =
    (deviceState: string) => (_dispatch: Dispatch, getState: GetState) =>
        selectLabelableEntities(getState(), deviceState);

export const getLabelableEntitiesDescriptors = () => (dispatch: Dispatch, getState: GetState) => {
    const device = selectDevice(getState());

    if (!device?.state) return [];

    const entitites = dispatch(getLabelableEntities(device.state));

    return entitites
        .map(entity => {
            if ('key' in entity) return entity.key;
            if ('state' in entity && entity.state) return entity.state;
            throw new Error('entity without unique identifier');
        })
        .sort((a, b) => a.localeCompare(b));
};

export const setEntititesDescriptors = (descriptors: string[]) => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.SET_ENTITIES_DESCRIPTORS,
        payload: descriptors,
    });
};

const fetchMetadata =
    ({
        provider,
        entity,
        encryptionVersion,
    }: {
        provider: MetadataProvider;
        entity: LabelableEntity;
        encryptionVersion: MetadataEncryptionVersion;
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
    (account: Account, encryptionVersion: MetadataEncryptionVersion) =>
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
    (device: TrezorDevice, encryptionVersion: MetadataEncryptionVersion) =>
    (dispatch: Dispatch, getState: GetState) => {
        if (!device.metadata[encryptionVersion]) {
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

        const encryptionVersion = selectEncryptionVersion(getState());

        if (!device?.state || !device?.metadata?.[encryptionVersion]) return;

        const fetchIntervalTrackingId = metadataUtils.getFetchTrackingId(
            'labels',
            provider.clientId,
            device.state,
        );

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
            const encryptionVersion = selectEncryptionVersion(getState());

            device = deviceStateArg
                ? selectDeviceByState(getState(), deviceStateArg)
                : selectDevice(getState());
            if (!device?.state || !device?.metadata?.[encryptionVersion]) return;

            dispatch(syncMetadataKeys(device, encryptionVersion));

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
            if (!device?.metadata?.[encryptionVersion]) {
                if (metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
                    clearInterval(metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]);
                    delete metadataProviderActions.fetchIntervals[fetchIntervalTrackingId];
                }

                return;
            }

            const labelableEntities = dispatch(getLabelableEntities(device.state));
            const promises = labelableEntities.map(entity =>
                dispatch(fetchMetadata({ provider, entity, encryptionVersion })).then(result => {
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
            if (device?.state && metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
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
    const encryptionVersion = selectEncryptionVersion(getState());

    devices.forEach(device => {
        if (!device.state || !device.metadata[encryptionVersion]) return;
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

        const encryptionVersion = selectEncryptionVersion(getState());

        const { fileName, aesKey } = device?.metadata[encryptionVersion] || {};
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
    (payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: GetState) => {
        const account = getState().wallet.accounts.find(a => a.key === payload.entityKey);
        const provider = selectSelectedProviderForLabels(getState());

        if (!account || !provider) {
            return Promise.resolve({
                success: false as const,
                error: 'account or provider missing',
            });
        }

        const encryptionVersion = selectEncryptionVersion(getState());

        // todo: not danger overwrite empty?
        const { fileName, aesKey } = account.metadata?.[encryptionVersion] || {};

        if (!fileName || !aesKey) {
            return Promise.resolve({
                success: false as const,
                error: `filename of version ${encryptionVersion} does not exist for account ${account.path}`,
            });
        }
        const data = provider.data[fileName];

        const nextMetadata = cloneObject(
            data ?? METADATA_LABELING.DEFAULT_ACCOUNT_METADATA,
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
        if (payload.skipSave) {
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
    (device: TrezorDevice, encryptionVersion: MetadataEncryptionVersion) =>
    async (dispatch: Dispatch, getState: GetState) => {
        if (!device.state || !device.connected) return;

        const result = await TrezorConnect.cipherKeyValue({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            ...METADATA_LABELING.ENCRYPTION_VERSION_CONFIGS[encryptionVersion],
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
 *
 * @returns files in storage provider split into [[...current][...old][...renamedOld]].
 */
const getMetadataFiles =
    () =>
    async (dispatch: Dispatch, getState: GetState): Promise<[string[], string[], string[]]> => {
        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstance({
                clientId: selectSelectedProviderForLabels(getState())!.clientId,
                dataType: 'labels',
            }),
        );

        if (!providerInstance) {
            throw new Error('no provider instance');
        }

        // fetch list of all files saved withing currently selected provider for labeling
        const files = await providerInstance.getFilesList().then(response => {
            if (!response.success) {
                dispatch(
                    metadataProviderActions.handleProviderError({
                        error: response,
                        action: ProviderErrorAction.LOAD,
                        clientId: providerInstance.clientId,
                    }),
                );

                return;
            }

            // todo: imho [] should be default return, it should not be also nullable
            return response?.payload || [];
        });

        // no files, fresh account, no metadata encryption version migration needed
        if (!files?.length) {
            return [[], [], []];
        }

        // todo: this is not future proof in case there is another encryption version
        const [currentEncryptionFiles, restFiles] = arrayPartition(files, file =>
            file.endsWith(`_v2.mtdt`),
        );

        const [renamedOldEncryptionFiles, oldEncryptionFiles] = arrayPartition(restFiles, file =>
            file.endsWith(`_v1.mtdt`),
        );

        return [currentEncryptionFiles, oldEncryptionFiles, renamedOldEncryptionFiles];
    };

const createMigrationPromise =
    (
        entity: LabelableEntity,
        prevEncryptionVersion: MetadataEncryptionVersion,
        fetchData: boolean,
        device: TrezorDevice,
    ) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const encryptionVersion = selectEncryptionVersion(getState());

        if (!device?.state || !device.metadata[encryptionVersion]) {
            return { success: false, error: 'device unexpected state' };
        }

        let selectedProvider = selectSelectedProviderForLabels(getState());

        const prevData =
            fetchData &&
            (await dispatch(
                fetchMetadata({
                    entity,
                    encryptionVersion: prevEncryptionVersion,
                    provider: selectedProvider!,
                }),
            ));

        const nextKeys = entity[encryptionVersion];

        if (!nextKeys) {
            return { success: false, error: 'next keys are missing' };
        }

        const dummy = { dummy: getWeakRandomId(getRandomNumberInRange(1, 100)) };
        const prevKeys = entity[prevEncryptionVersion];
        if (!prevKeys) {
            return { success: false, error: 'prev keys are missing' };
        }

        const defaultEntityData =
            entity.type === 'account'
                ? cloneObject(METADATA_LABELING.DEFAULT_ACCOUNT_METADATA)
                : cloneObject(METADATA_LABELING.DEFAULT_WALLET_METADATA);

        const nextData =
            prevData && 'data' in prevData
                ? { ...prevData.data, migratedFrom: prevKeys.fileName }
                : { ...defaultEntityData, ...dummy };

        selectedProvider = selectSelectedProviderForLabels(getState());

        if (!selectedProvider) {
            return { success: false, error: 'provider not selected' };
        }

        const providerInstance = dispatch(
            metadataProviderActions.getProviderInstance({
                clientId: selectedProvider.clientId,
                dataType: 'labels',
            }),
        );

        if (!providerInstance) {
            // provider should always be set here
            return { success: false, error: 'provider not connected' };
        }

        dispatch(
            metadataActions.setMetadata({
                ...nextKeys,
                data: nextData,
                provider: getState().metadata.providers[0]!,
            }),
        );

        const saveResult = await metadataActions.encryptAndSaveMetadata({
            ...nextKeys,
            data: nextData,
            providerInstance,
        });

        if (!saveResult.success) {
            return saveResult;
        }

        // we were only creating dummy
        if (!fetchData) {
            return { success: true };
        }

        // rename only if next version was saved correctly
        return providerInstance.renameFile(
            prevKeys.fileName,
            prevKeys.fileName.replace('.mtdt', '_v1.mtdt'),
        );
    };

/**
 * Check whether encryption version migration is needed and if yes execute it
 */
const handleEncryptionVersionMigration =
    (deviceState: string) =>
    async (
        dispatch: Dispatch,
        getState: GetState,
    ): Promise<{ success: boolean; error?: string }> => {
        const prevEncryptionVersion = 1;

        let device = selectDeviceByState(getState(), deviceState);

        if (!device) {
            // should never happen
            return { success: false, error: 'metadata migration: device not found' };
        }

        // 3. fetch list of all files saved withing currently selected provider for labeling. based on file suffix we are
        //    able to determine which files are associated with which encryption version
        const [currentEncryptionFiles, oldEncryptionFiles, renamedOldEncryptionFiles] =
            await dispatch(getMetadataFiles());

        // 4. there are no old files (either labeling was never used before, old old files were renamed to file_v1.mdtd)
        // also note, that we take into account only those oldEncryption files which do not have their renamed version concurrently existinging in renamedOldEncryptionFiles
        // this could happen in a very rare edgecase:
        // 1. user does migration in updated suite which already has encryption v2, this renames old encryption file
        // 2. user goes to old suite, creates a label, old encryption file is created. now old renamed and old exist together
        // 3. => this means that suite is trying to "enable labeling" forever but it never actually carries out migration because it stops on later
        //       condition "everyEntityHasNewFile"
        if (
            oldEncryptionFiles.filter(
                file => !renamedOldEncryptionFiles.includes(`${file}_v1.mtdt`),
            ).length === 0
        ) {
            return { success: true };
        }

        // 5. there are old files, but also all labelable entities currently known to suite have some record in currentEncryptionFiles.
        //    this means that they have already been migrated or dummy file was created
        const everyEntityHasNewFile = dispatch(getLabelableEntities(deviceState)).every(entity => {
            const nextKeys = entity[2];

            if (!nextKeys) {
                // todo: should never happend but happend once during testing.
                throw new Error('metadata migration: next keys are missing');
            }

            return currentEncryptionFiles.find(file => file === nextKeys.fileName);
        });

        if (everyEntityHasNewFile) {
            return { success: true };
        }

        // 7. sync metadata keys for prev encryption version.
        //    NOTE: result of this operation is saved for device and account encryption keys are computed from it. This means that we can add new accounts at any point of time later without calling this again
        if (!device.metadata[prevEncryptionVersion]) {
            await dispatch(setDeviceMetadataKey(device, prevEncryptionVersion));
        }
        device = selectDeviceByState(getState(), deviceState);
        if (!device?.metadata[prevEncryptionVersion]?.key) {
            return { success: false, error: 'metadata migration: cancelled' };
        }

        dispatch(syncMetadataKeys(device, prevEncryptionVersion));

        if (!device.state) {
            // this should never happen
            return { success: false, error: 'metadata migration: device not authorized' };
        }

        // 8. get labelable entitites again (there was async operation in between)
        const allEntities = dispatch(getLabelableEntities(device.state));

        // 9. split labelable entities into 2 groups:
        //    - entitiesToMigrate: don't have new file && have old file
        //    - entititiesToCreateDummies: don't have new file && don't have old file

        const entitiesToMigrate: LabelableEntity[] = [];
        const entititiesToCreateDummies: LabelableEntity[] = [];
        allEntities.forEach(entity => {
            const prevKeys = entity[prevEncryptionVersion];

            if (!prevKeys) {
                console.error('metadata migration: prev keys are missing');

                return; // should never happen
            }
            const nextKeys = entity[2];

            if (!nextKeys) {
                console.error('metadata migration: next keys are missing');

                return; // should never happen
            }

            const oldFileExists = oldEncryptionFiles.find(file => file === prevKeys.fileName);
            const newFileExists = currentEncryptionFiles.find(file => file === nextKeys.fileName);

            if (newFileExists) {
                return; // already migrated
            }

            if (!oldFileExists) {
                entititiesToCreateDummies.push(entity);

                return; // there is nothing to migrate,
            }

            entitiesToMigrate.push(entity);
        });

        // 10. now all data is ready. we know what operations should be carried out. dummy files will be created, old files will be migrated and their content will be filled into local state

        // NOTE: I understand that this is not the right layer to rate limit access to provider API. It should be handled in provider service itself but
        // I don't have free hands to do it now. So I am running all requests in series as a workaround now. Correct solution would be
        // implementing provider.batchWrite and do batching if possible and if not, use single requests with some rate limiting
        const promises = [
            ...entitiesToMigrate.map(
                entity => () =>
                    dispatch(createMigrationPromise(entity, prevEncryptionVersion, true, device!)),
            ),

            // todo: maybe not needed to create dummies in case we manage to migrate all old files.
            ...entititiesToCreateDummies.map(
                entity => () =>
                    dispatch(createMigrationPromise(entity, prevEncryptionVersion, false, device!)),
            ),
        ];

        for (let i = 0; i < promises.length; ++i) {
            /* eslint-disable no-await-in-loop */
            const result = await promises[i]();
            if (!result.success) {
                return result;
            }
        }

        return { success: true };
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
    (force: boolean, deviceState?: string) => async (dispatch: Dispatch, getState: GetState) => {
        let device = deviceState
            ? selectDeviceByState(getState(), deviceState)
            : selectDevice(getState());

        console.log('metadata actions init!');
        if (!device?.state) {
            return false;
        }

        if (!force && getState().metadata.error?.[device.state]) {
            return false;
        }

        if (getState().metadata.initiating) {
            console.log('metadata actions stop 1');

            return true;
        }

        dispatch(setEntititesDescriptors(dispatch(getLabelableEntitiesDescriptors())));

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

        const encryptionVersion = selectEncryptionVersion(getState());
        if (!device.metadata?.[encryptionVersion]) {
            const result = await dispatch(setDeviceMetadataKey(device, encryptionVersion));
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

        device = deviceState
            ? selectDeviceByState(getState(), deviceState)
            : selectDevice(getState());

        if (!device) return false;

        // 3. we have master key. use it to derive account keys
        dispatch(syncMetadataKeys(device, encryptionVersion));

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

        if (encryptionVersion === 2) {
            // 5. migration
            if (!getState().metadata.initiating) {
                dispatch({ type: METADATA.SET_INITIATING, payload: true });
            }

            const migrationResult = await dispatch(handleEncryptionVersionMigration(device.state!));
            // failed migration => labeling disabled
            if (!migrationResult.success) {
                dispatch({ type: METADATA.SET_INITIATING, payload: false });
                dispatch({ type: METADATA.SET_EDITING, payload: undefined });
                dispatch({
                    type: METADATA.SET_ERROR_FOR_DEVICE,
                    payload: {
                        deviceState: device.state!,
                        failed: true,
                    },
                });
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: `migration failed: ${migrationResult.error}`,
                    }),
                );

                return false;
            }
        }

        // 6. fetch metadata
        await dispatch(fetchAndSaveMetadata(device.state));

        // now we may allow user to edit labels. everything is ready, local data is synced with provider
        if (getState().metadata.initiating) {
            dispatch({ type: METADATA.SET_INITIATING, payload: false });
        }

        const selectedProvider = selectSelectedProviderForLabels(getState());
        device = deviceState
            ? selectDeviceByState(getState(), deviceState)
            : selectDevice(getState());

        if (!device?.state || !selectedProvider) {
            return true;
        }

        const fetchIntervalTrackingId = metadataUtils.getFetchTrackingId(
            'labels',
            selectedProvider.clientId,
            device.state,
        );

        // 7. if interval for watching provider is not set, create it
        if (device.state && !metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
            // todo: possible race condition that has been around since always
            // user is editing label and at that very moment update arrives. updates to specific entities should be probably discarded in such case?
            metadataProviderActions.fetchIntervals[fetchIntervalTrackingId] = setInterval(() => {
                const device = selectDevice(getState());
                if (!getState().suite.online || !device?.state) {
                    return;
                }
                dispatch(fetchAndSaveMetadata(device.state));
            }, 60_000);
        }

        return true;
    };

export const setEditing = (payload: string | undefined): MetadataAction => ({
    type: METADATA.SET_EDITING,
    payload,
});
