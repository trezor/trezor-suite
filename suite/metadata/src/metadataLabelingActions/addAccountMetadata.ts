import { type Dispatch } from '@reduxjs/toolkit';

import { type AccountLabels, type MetadataAddPayload } from '@suite-common/metadata-types';
import { selectAccounts } from '@suite-common/wallet-core';
import { cloneObject } from '@trezor/utils';

import * as metadataDataThunks from '../metadataDataThunks';
import * as METADATA_LABELING from '../metadataLabelingConstants';
import * as metadataProviderActions from '../metadataProviderThunks';
import { type MetadataRootState, selectSelectedProviderForLabels } from '../metadataReducer';

/**
 * @param payload - Metadata payload.
 * @param save - Should metadata be saved into persistent storage? This is useful when you are
 * updating multiple records in a single account; set "save" to true only for the last call.
 */
export const addAccountMetadata =
    (payload: Exclude<MetadataAddPayload, { type: 'walletLabel' }>) =>
    (dispatch: Dispatch, getState: () => MetadataRootState) => {
        const account = selectAccounts(getState()).find(a => a.key === payload.entityKey);
        const provider = selectSelectedProviderForLabels(getState());

        if (!account || !provider) {
            return Promise.resolve({
                success: false as const,
                error: 'account or provider missing',
            });
        }

        // Todo: not danger overwrite empty?
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

        // We might intentionally skip saving metadata content to persistent storage.
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
            // Provider should always be set here.
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
