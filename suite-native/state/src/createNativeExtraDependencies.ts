import {
    type ExtraDependenciesStatic,
    notImplementedAction,
    notImplementedActionType,
    notImplementedReducer,
    notImplementedThunk,
} from '@suite-common/extra-dependencies';
import { forgetBluetoothDeviceThunk } from '@suite-native/bluetooth';

import { type NativeServices } from './createNativeCompositionRoot';

export type ExtraDependenciesNative = ExtraDependenciesStatic & { services: NativeServices };

export const extraDependencies: ExtraDependenciesStatic = {
    thunks: {
        forgetBluetoothDevice: forgetBluetoothDeviceThunk,

        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        fetchAndSaveMetadata: notImplementedThunk('fetchAndSaveMetadata'),
        initMetadata: notImplementedThunk('initMetadata'),
        addAccountMetadata: notImplementedThunk('addAccountMetadata'),
    },
    actions: {
        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        setAccountAddMetadata: notImplementedAction('setAccountAddMetadata'),
        lockDevice: notImplementedAction('lockDevice'),
        onModalCancel: notImplementedAction('onModalCancel'),
        openModal: notImplementedAction('openModal'),
    },
    actionTypes: {
        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        storageLoad: notImplementedActionType('storageLoad'),
        setDeviceMetadata: notImplementedActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: notImplementedActionType('setDeviceMetadataPasswords'),
    },
    reducers: {
        // Not implemented. We assume those are NEVER called on Native
        // need for this is architectural mistake. Please DO NOT add more and try
        // to remove them.
        storageLoadBlockchain: notImplementedReducer('storageLoadBlockchain'),
        storageLoadExplorer: notImplementedReducer('storageLoadExplorer'),
        storageLoadAccounts: notImplementedReducer('storageLoadAccounts'),
        storageLoadTransactions: notImplementedReducer('storageLoadTransactions'),
        storageLoadPhishingMetadata: notImplementedReducer('storageLoadPhishingMetadata'),
        storageLoadHistoricRates: notImplementedReducer('storageLoadHistoricRates'),
        setDeviceMetadataReducer: notImplementedReducer('setDeviceMetadataReducer'),
        setDeviceMetadataPasswordsReducer: notImplementedReducer(
            'setDeviceMetadataPasswordsReducer',
        ),
        storageLoadDevices: notImplementedReducer('storageLoadDevices'),
        storageLoadFormDrafts: notImplementedReducer('storageLoadFormDrafts'),
        storageLoadTokenManagement: notImplementedReducer('storageLoadTokenManagement'),
        storageLoadWalletSettings: notImplementedReducer('storageLoadWalletSettings'),
        storageLoadBioAuth: notImplementedReducer('storageLoadBioAuth'),
        storageLoadFlags: notImplementedReducer('storageLoadFlags'),
        storageLoadSuiteSettings: notImplementedReducer('storageLoadSuiteSettings'),
        storageLoadReceiveAccounts: notImplementedReducer('storageLoadReceiveAccounts'),
    },
};
