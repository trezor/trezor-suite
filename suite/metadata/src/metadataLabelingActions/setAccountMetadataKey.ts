import { type Dispatch } from '@reduxjs/toolkit';

import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { ProviderErrorAction } from '@suite-common/metadata-types';
import { type Account } from '@suite-common/wallet-types';

import * as METADATA_LABELING from '../metadataLabelingConstants';
import * as metadataProviderActions from '../metadataProviderThunks';
import { type MetadataRootState } from '../metadataReducer';
import * as metadataUtils from '../metadataUtils';

export const setAccountMetadataKey =
    (account: Account, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    (dispatch: Dispatch, getState: () => MetadataRootState) => {
        const device = selectDeviceByStaticSessionId(getState(), account.deviceState);
        const deviceMetaKey = device?.metadata[encryptionVersion]?.key;

        if (!deviceMetaKey) {
            // Account keys can't be set without device keys.
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
