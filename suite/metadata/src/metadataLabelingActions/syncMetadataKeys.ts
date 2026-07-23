import { type Dispatch } from '@reduxjs/toolkit';

import { type TrezorDevice } from '@suite-common/suite-types';
import { selectAccounts } from '@suite-common/wallet-core';

import * as metadataActions from '../metadataActions';
import * as METADATA_LABELING from '../metadataLabelingConstants';
import { type MetadataRootState } from '../metadataReducer';
import { setAccountMetadataKey } from './setAccountMetadataKey';

/**
 * Fill any record in reducer that may have metadata with metadata keys (not values).
 */
export const syncMetadataKeys =
    (device: TrezorDevice, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: () => MetadataRootState) => {
        if (!device.metadata[METADATA_LABELING.ENCRYPTION_VERSION]) {
            return;
        }
        const targetAccounts = selectAccounts(getState()).filter(
            account =>
                !account.metadata[encryptionVersion]?.fileName &&
                account.deviceState === device.state?.staticSessionId,
        );

        targetAccounts.forEach(account => {
            const accountWithMetadata = dispatch(setAccountMetadataKey(account, encryptionVersion));
            dispatch(metadataActions.setAccountAdd(accountWithMetadata));
        });
        // Note that devices are intentionally omitted here - device receives metadata
        // keys sooner when enabling labeling on device.
    };
