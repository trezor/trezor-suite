import { type Dispatch } from '@reduxjs/toolkit';

import { ProviderErrorAction } from '@suite-common/metadata-types';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectAccounts } from '@suite-common/wallet-core';

import * as metadataActions from './metadataActions';
import * as METADATA_LABELING from './metadataLabelingConstants';
import * as metadataProviderActions from './metadataProviderThunks';
import { type MetadataRootState } from './metadataReducer';
import * as metadataUtils from './metadataUtils';

/**
 * Fill any record in reducer that may have metadata with metadata keys (not values).
 */
export const syncMetadataKeys =
    (device: TrezorDevice, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: () => MetadataRootState) => {
        const deviceMetadataKey = device.metadata[encryptionVersion]?.key;

        if (!deviceMetadataKey) {
            return;
        }

        const targetAccounts = selectAccounts(getState()).filter(
            account =>
                !account.metadata[encryptionVersion]?.fileName &&
                account.deviceState === device.state?.staticSessionId,
        );

        targetAccounts.forEach(account => {
            try {
                const accountWithMetadata = metadataUtils.getAccountWithMetadataKey(
                    account,
                    deviceMetadataKey,
                    encryptionVersion,
                );
                dispatch(metadataActions.setAccountAdd(accountWithMetadata));
            } catch (error) {
                dispatch(
                    metadataProviderActions.handleProviderError({
                        error,
                        action: ProviderErrorAction.SAVE,
                    }),
                );
            }
        });
        // note that devices are intentionally omitted here - device receives metadata
        // keys sooner when enabling labeling on device;
    };
