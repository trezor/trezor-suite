import { type Dispatch } from '@reduxjs/toolkit';

import { selectDevices } from '@suite-common/device';
import { type MetadataAddPayload, type WalletLabels } from '@suite-common/metadata-types';
import { cloneObject } from '@trezor/utils';

import * as metadataDataThunks from '../metadataDataThunks';
import * as METADATA_LABELING from '../metadataLabelingConstants';
import * as metadataProviderActions from '../metadataProviderThunks';
import { type MetadataRootState, selectSelectedProviderForLabels } from '../metadataReducer';

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

        // Todo: not danger overwrite empty?
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
            // Provider should always be set here.
            return Promise.resolve({ success: false as const, error: 'no provider instance' });
        }

        return metadataDataThunks.encryptAndSaveMetadata({
            data: { walletLabel },
            aesKey,
            fileName,
            providerInstance,
        });
    };
