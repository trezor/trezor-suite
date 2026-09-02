import { type ActionCreatorWithPreparedPayload } from '@reduxjs/toolkit';

import {
    type FetchAndSaveMetadataDep,
    type MetadataAddPayload,
} from '@suite-common/metadata-types';
import { type SuiteCompatibleThunk } from '@suite-common/redux-utils';
import { type OnModalCancelDep, type OpenModalDep } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { type BluetoothDeviceId } from '@trezor/connect';

type BaseReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadTransactionsReducer = (state: any, action: { type: any; payload: any }) => void;

export type ExtraDependenciesStatic = {
    /** @deprecated Do not add any thunks here, this is antipattern. */
    thunks: FetchAndSaveMetadataDep & {
        initMetadata: SuiteCompatibleThunk<boolean>;
        addAccountMetadata: SuiteCompatibleThunk<
            Exclude<MetadataAddPayload, { type: 'walletLabel' }>
        >;
        forgetBluetoothDevice: SuiteCompatibleThunk<{
            bluetoothId: BluetoothDeviceId;
            skipToggleModalConnection?: boolean;
            isOsUnpairingFinished?: boolean;
            skipDisconnect?: boolean;
        }>;
    };
    // You should only use ActionCreatorWithPayload from redux-toolkit!
    // That means you will need to convert actual action creators in packages/suite to use createAction from redux-toolkit,
    // but that shouldn't be problem.
    actions: OnModalCancelDep &
        OpenModalDep & {
            setAccountAddMetadata: ActionCreatorWithPreparedPayload<[payload: Account], Account>;
            lockDevice: ActionCreatorWithPreparedPayload<[payload: boolean], boolean>;
        };
    // Use action types + reducers as last resort if you can't use actions creators. For example for storageLoad it is used because
    // it would be really hard to move all types to @suite-common that are needed to type payload. This comes at cost of
    // having "any" type for action.payload in reducer. We can overcome this issue if we define reducers of storageLoad
    // in place where we have all types available to ensure type safety.
    actionTypes: {
        storageLoad: string;
        setDeviceMetadata: string;
        setDeviceMetadataPasswords: string;
    };
    reducers: {
        storageLoadBlockchain: StorageLoadReducer;
        storageLoadExplorer: StorageLoadReducer;
        storageLoadAccounts: StorageLoadReducer;
        storageLoadTransactions: StorageLoadTransactionsReducer;
        storageLoadPhishingMetadata: StorageLoadReducer;
        storageLoadHistoricRates: StorageLoadReducer;
        setDeviceMetadataReducer: BaseReducer;
        setDeviceMetadataPasswordsReducer: BaseReducer;
        storageLoadDevices: StorageLoadReducer;
        storageLoadFormDrafts: StorageLoadReducer;
        storageLoadTokenManagement: StorageLoadReducer;
        storageLoadStellarContractTokens: StorageLoadReducer;
        storageLoadWalletSettings: StorageLoadReducer;
        storageLoadBioAuth: StorageLoadReducer;
        storageLoadFlags: StorageLoadReducer;
        storageLoadSuiteSettings: StorageLoadReducer;
        storageLoadReceiveAccounts: StorageLoadReducer;
    };
};
