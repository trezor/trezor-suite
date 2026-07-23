import { type Dispatch } from '@reduxjs/toolkit';

import { selectDeviceByStaticSessionId, selectSelectedDevice } from '@suite-common/device';
import {
    type MetadataEncryptionVersion,
    type MetadataProvider,
    ProviderErrorAction,
} from '@suite-common/metadata-types';
import { type StaticSessionId } from '@trezor/connect';
import { throwError } from '@trezor/utils';

import * as metadataDataThunks from './metadataDataThunks';
import * as METADATA_LABELING from './metadataLabelingConstants';
import * as metadataProviderActions from './metadataProviderThunks';
import {
    type MetadataRootState,
    selectLabelableEntities,
    selectSelectedProviderForLabels,
} from './metadataReducer';
import * as metadataUtils from './metadataUtils';
import { syncMetadataKeys } from './syncMetadataKeys';

const getLabelableEntities =
    (deviceState: StaticSessionId) => (_dispatch: Dispatch, getState: () => MetadataRootState) =>
        selectLabelableEntities(getState(), deviceState);

type LabelableEntity = ReturnType<ReturnType<typeof getLabelableEntities>>[number];

const inFlightMetadataFetches = new Map<
    ReturnType<typeof metadataUtils.getFetchTrackingId>,
    Promise<unknown>
>();

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
            metadataProviderActions.getProviderInstance({
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

const fetchAndSaveMetadataForDevice =
    (deviceStateArg?: StaticSessionId) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState) => {
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
                ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
                : selectSelectedDevice(getState());
            if (
                !device?.state?.staticSessionId ||
                !device?.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]
            )
                return;

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
            if (!device?.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION]) {
                if (metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]) {
                    clearInterval(metadataProviderActions.fetchIntervals[fetchIntervalTrackingId]);
                    delete metadataProviderActions.fetchIntervals[fetchIntervalTrackingId];
                }

                return;
            }

            const labelableEntities = dispatch(getLabelableEntities(device.state.staticSessionId));
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

export const fetchAndSaveMetadata =
    (deviceStateArg?: StaticSessionId) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState) => {
        const provider = selectSelectedProviderForLabels(getState());
        const device = deviceStateArg
            ? selectDeviceByStaticSessionId(getState(), deviceStateArg)
            : selectSelectedDevice(getState());

        if (!provider || !device?.state?.staticSessionId) {
            return;
        }

        const fetchTrackingId = metadataUtils.getFetchTrackingId(
            'labels',
            provider.clientId,
            device.state.staticSessionId,
        );
        const existingFetchPromise = inFlightMetadataFetches.get(fetchTrackingId);
        if (existingFetchPromise) {
            return existingFetchPromise;
        }

        const fetchPromise = fetchAndSaveMetadataForDevice(deviceStateArg)(dispatch, getState);
        inFlightMetadataFetches.set(fetchTrackingId, fetchPromise);

        try {
            await fetchPromise;
        } finally {
            if (inFlightMetadataFetches.get(fetchTrackingId) === fetchPromise) {
                inFlightMetadataFetches.delete(fetchTrackingId);
            }
        }
    };
