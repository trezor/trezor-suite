import {
    type ActionCreatorWithPayload,
    type ActionCreatorWithPreparedPayload,
    type ActionCreatorWithoutPayload,
} from '@reduxjs/toolkit';

import type { AnalyticsSharedEvents } from '@suite-common/analytics';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption'; // also only types
import { type MigrateSuiteSyncLabelsForRbfTransactionDep } from '@suite-common/suite-rbf-labels-migrations-types';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import {
    type ReportSecurityCheckDep,
    type Route,
    type TrezorDevice,
    type UserContextPayload,
} from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AddressDisplayOptions,
    type SelectedAccountStatus,
} from '@suite-common/wallet-types';
import { type Analytics } from '@trezor/analytics-uploader';
import {
    type BlockchainBlock,
    type BluetoothDeviceId,
    type ConnectSettings,
    type Manifest,
    type StaticSessionId,
} from '@trezor/connect';

import { type ActionType, type SuiteCompatibleSelector, type SuiteCompatibleThunk } from './types';

type BaseReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadTransactionsReducer = (state: any, action: { type: any; payload: any }) => void;

export type ConnectInitSettings = {
    manifest: Manifest;
} & Partial<ConnectSettings>;

export type CommonServices = SuiteSyncDep &
    EnsureDelegatedIdentityKeyDep &
    PlatformEncryptionDep & {
        analytics: Analytics<AnalyticsSharedEvents>;
        saveAs: (data: Blob, fileName: string) => void;
        connectInitSettings: ConnectInitSettings;
    } & ReportSecurityCheckDep &
    MigrateSuiteSyncLabelsForRbfTransactionDep;

export type ExtraDependenciesStatic = {
    /** @deprecated Do not add any thunks here, this is antipattern. */
    thunks: {
        cardanoValidatePendingTxOnBlock: SuiteCompatibleThunk<{
            block: BlockchainBlock;
            timestamp: number;
        }>;
        initMetadata: SuiteCompatibleThunk<boolean>;
        fetchAndSaveMetadata: SuiteCompatibleThunk<StaticSessionId>;
        addAccountMetadata: SuiteCompatibleThunk<
            Exclude<MetadataAddPayload, { type: 'walletLabel' }>
        >;
        forgetBluetoothDevice: SuiteCompatibleThunk<{ bluetoothId: BluetoothDeviceId }>;
    };
    selectors: {
        // TODO when tokens are implemented 1:1 in both apps, delete from extras
        // wallet-core selector is used in desktop, but suite-native has its own implementation
        selectTokenDefinitionsEnabledNetworks: SuiteCompatibleSelector<NetworkSymbol[]>;
        // todo: we do not want to, so far, transfer coinjoin to @suite-common
        // but this is exactly what I need to get DebugModeOptions type instead of any
        selectDebugSettings: SuiteCompatibleSelector<any>;
        selectDesktopBinDir: SuiteCompatibleSelector<string | undefined>;
        // a wallet-core selector that could be reused directly, but this one is used very often and would create circular deps
        selectDevice: SuiteCompatibleSelector<TrezorDevice | undefined>;
        selectLanguage: SuiteCompatibleSelector<string>;
        selectIsWindowVisible: SuiteCompatibleSelector<boolean>;
        selectRouterApp: SuiteCompatibleSelector<string>;
        selectRoute: SuiteCompatibleSelector<Route | undefined>;
        selectMetadata: SuiteCompatibleSelector<any>;
        selectAddressDisplayType: SuiteCompatibleSelector<AddressDisplayOptions>;
        selectSelectedAccount: SuiteCompatibleSelector<SelectedAccountStatus>;
        selectSelectedAccountStatus: SuiteCompatibleSelector<SelectedAccountStatus['status']>;
        selectIsSuiteSyncEnabled: SuiteCompatibleSelector<boolean>;
        selectTradingEnvironment: SuiteCompatibleSelector<
            'production' | 'staging' | 'dev' | 'localhost' | undefined
        >;
        selectIsViewOnlyByDefaultEnabled: SuiteCompatibleSelector<boolean>;
        selectThpSettings: SuiteCompatibleSelector<NonNullable<ConnectSettings['thp']>>;
        selectAllowPrerelease: SuiteCompatibleSelector<boolean>;
    };
    // You should only use ActionCreatorWithPayload from redux-toolkit!
    // That means you will need to convert actual action creators in packages/suite to use createAction from redux-toolkit,
    // but that shouldn't be problem.
    actions: {
        setAccountAddMetadata: ActionCreatorWithPreparedPayload<[payload: Account], Account>;
        lockDevice: ActionCreatorWithPreparedPayload<[payload: boolean], boolean>;
        onModalCancel: ActionCreatorWithoutPayload;
        openModal: ActionCreatorWithPayload<UserContextPayload>;
    };
    // Use action types + reducers as last resort if you can't use actions creators. For example for storageLoad it is used because
    // it would be really hard to move all types to @suite-common that are needed to type payload. This comes at cost of
    // having "any" type for action.payload in reducer. We can overcome this issue if we define reducers of storageLoad
    // in place where we have all types available to ensure type safety.
    actionTypes: {
        storageLoad: ActionType;
        setDeviceMetadata: ActionType;
        setDeviceMetadataPasswords: ActionType;
    };
    reducers: {
        storageLoadBlockchain: StorageLoadReducer;
        storageLoadExplorer: StorageLoadReducer;
        storageLoadAccounts: StorageLoadReducer;
        storageLoadTransactions: StorageLoadTransactionsReducer;
        storageLoadHistoricRates: StorageLoadReducer;
        setDeviceMetadataReducer: BaseReducer;
        setDeviceMetadataPasswordsReducer: BaseReducer;
        storageLoadDevices: StorageLoadReducer;
        storageLoadFormDrafts: StorageLoadReducer;
        storageLoadTokenManagement: StorageLoadReducer;
        storageLoadWalletSettings: StorageLoadReducer;
        storageLoadBioAuth: StorageLoadReducer;
        storageLoadFlags: StorageLoadReducer;
    };
};

export type ExtraDependencies = ExtraDependenciesStatic & { services: CommonServices };

export type ExtraDependenciesForReducer = Pick<
    ExtraDependencies,
    'actionTypes' | 'actions' | 'reducers'
>;

export type ExtraDependenciesPartial = {
    [K in keyof ExtraDependencies]?: Partial<ExtraDependencies[K]>;
};

export type CustomThunkAPI = {
    state: any;
    extra: ExtraDependencies;
};
