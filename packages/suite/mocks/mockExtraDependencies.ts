import { metadataActions } from '@suite/metadata';
import { changeNetworks } from '@suite-common/wallet-core';

import { storageLoadReducers } from '../src/support/storageLoadReducers';

export const mockExtraDependencies = {
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        changeNetworks,
    },
    actionTypes: {
        storageLoad: '@storage/load',
        setDeviceMetadata: '@metadata/set-device-metadata',
        setDeviceMetadataPasswords: '@metadata/set-device-metadata-passwords',
    } as const,
    reducers: storageLoadReducers,
};
