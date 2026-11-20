import { forgetBluetoothDeviceThunk } from '@suite/bluetooth';
import { metadataActions, metadataLabelingActions } from '@suite/metadata';
import { closeModal, openModal } from '@suite/modal';
import { type ExtraDependenciesStatic } from '@suite-common/extra-dependencies';
import { type TokenDefinitionsMiddlewareDeps } from '@suite-common/token-definitions';
import { changeNetworks } from '@suite-common/wallet-core';
import { type WithServices } from '@trezor/redux-utils';
import { storageLoadReducers } from '@trezor/suite';

import { type SuiteServices } from './suiteServices';

export type ExtraDependenciesSuite = ExtraDependenciesStatic &
    TokenDefinitionsMiddlewareDeps &
    WithServices<SuiteServices>;

export const extraDependencies: ExtraDependenciesStatic & TokenDefinitionsMiddlewareDeps = {
    thunks: {
        fetchAndSaveMetadata: metadataLabelingActions.fetchAndSaveMetadataThunk,
        forgetBluetoothDevice: forgetBluetoothDeviceThunk,
    },
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        onModalCancel: closeModal,
        openModal,
        changeNetworks,
    },
    actionTypes: {
        storageLoad: '@storage/load',
        setDeviceMetadata: '@metadata/set-device-metadata',
        setDeviceMetadataPasswords: '@metadata/set-device-metadata-passwords',
    },
    reducers: storageLoadReducers,
};
