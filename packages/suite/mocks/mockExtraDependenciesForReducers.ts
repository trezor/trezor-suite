import { metadataActions } from '@suite/metadata';
import { changeNetworks } from '@suite-common/wallet-core';
import { type ActionTypesDep } from '@trezor/redux-utils';

import { storageLoadReducers } from '../src/support/storageLoadReducers';

type MockExtraDependenciesForReducers = ActionTypesDep<
    'storageLoad' | 'setDeviceMetadata' | 'setDeviceMetadataPasswords'
> & {
    actions: {
        setAccountAddMetadata: typeof metadataActions.setAccountAdd;
        changeNetworks: typeof changeNetworks;
    };
    reducers: typeof storageLoadReducers;
};

/**
 * Supplies dependencies required by reducer factories so existing tests can compose feature
 * slices without importing the application's dependency registry or assembled reducers.
 *
 * @deprecated This shared dependency registry is a legacy anti-pattern that couples unrelated
 * tests. New tests should declare only the dependencies required by their reducers.
 */
export const mockExtraDependenciesForReducers: MockExtraDependenciesForReducers = {
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        changeNetworks,
    },
    actionTypes: {
        storageLoad: '@storage/load',
        setDeviceMetadata: '@metadata/set-device-metadata',
        setDeviceMetadataPasswords: '@metadata/set-device-metadata-passwords',
    },
    reducers: storageLoadReducers,
};
