import {
    type ActionCreatorWithPayload,
    type ActionCreatorWithPreparedPayload,
    type ActionCreatorWithoutPayload,
} from '@reduxjs/toolkit';

import type { AddressValidatorDep } from '@suite-common/address';
import type { AnalyticsSharedEvents } from '@suite-common/analytics';
import { type Bip329Dep } from '@suite-common/bip329-types';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import type { NetworkModuleRepositoryDep } from '@suite-common/networks';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption'; // also only types
import { type MigrateSuiteSyncLabelsForRbfTransactionDep } from '@suite-common/suite-rbf-labels-migrations-types';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import {
    type ReloadAppDep,
    type ReportSecurityCheckDep,
    type UserContextPayload,
} from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type SelectedAccountStatus,
} from '@suite-common/wallet-types';
import { type Analytics } from '@trezor/analytics-uploader';
import {
    type BluetoothDeviceId,
    type ConnectSettings,
    type CreateLogger,
    type CreateLoggerDep,
    type Manifest,
    type StaticSessionId,
    type ThpSettings,
} from '@trezor/connect';
import type { Transport } from '@trezor/transport-common';
import { type KeyedThrottle } from '@trezor/utils';

import { type ConnectInitHooks } from './connectInitHooksType';
import { type ActionType, type SuiteCompatibleSelector, type SuiteCompatibleThunk } from './types';

type BaseReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadTransactionsReducer = (state: any, action: { type: any; payload: any }) => void;

export type ConnectInitSettings = {
    manifest: Manifest;
} & Partial<ConnectSettings>;

export type ThpHostNameDep = { thpHostName?: string };

export type TransportName =
    | 'BridgeTransport'
    | 'NodeUsbTransport'
    | 'UdpTransport'
    | 'WebUsbTransport';

// Web/native yield a constructed Transport instance. The desktop renderer can't build node-only
// transports (`usb`/`dgram`), so it yields the identifier string — the main process maps it to an
// instance below the IPC boundary (see suite-desktop-core/src/modules/trezor-connect.ts).
export type TransportFactory = (logger?: CreateLogger) => Transport | TransportName;

export type GetTransportsFactories = () => Partial<Record<TransportName, TransportFactory>>;

export type GetTransportsFactoriesDep = {
    getTransportsFactories: GetTransportsFactories;
};

export type CreateTransports = (transports: TransportName[]) => ConnectSettings['transports'];

export type TransportsDep = { createTransports: CreateTransports };

export type CommonServices = SuiteSyncDep &
    AddressValidatorDep &
    NetworkModuleRepositoryDep &
    Bip329Dep &
    EnsureDelegatedIdentityKeyDep &
    PlatformEncryptionDep & {
        analytics: Analytics<AnalyticsSharedEvents>;
        saveAs: (data: Blob, fileName: string) => void;
        connectInitSettings: ConnectInitSettings;
        connectInitHooks: ConnectInitHooks;
        accountRefreshThrottle: KeyedThrottle<Account['key']>;
    } & ReportSecurityCheckDep &
    ReloadAppDep &
    MigrateSuiteSyncLabelsForRbfTransactionDep &
    CreateLoggerDep &
    ThpHostNameDep &
    TransportsDep;

export type ExtraDependenciesStatic = {
    /** @deprecated Do not add any thunks here, this is antipattern. */
    thunks: {
        initMetadata: SuiteCompatibleThunk<boolean>;
        fetchAndSaveMetadata: SuiteCompatibleThunk<StaticSessionId>;
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
    selectors: {
        // TODO when tokens are implemented 1:1 in both apps, delete from extras
        // wallet-core selector is used in desktop, but suite-native has its own implementation
        selectTokenDefinitionsEnabledNetworks: SuiteCompatibleSelector<NetworkSymbol[]>;
        // todo: we do not want to, so far, transfer coinjoin to @suite-common
        // but this is exactly what I need to get DebugModeOptions type instead of any
        selectDebugSettings: SuiteCompatibleSelector<any>;
        selectDesktopBinDir: SuiteCompatibleSelector<string | undefined>;
        selectLanguage: SuiteCompatibleSelector<string>;
        selectIsWindowVisible: SuiteCompatibleSelector<boolean>;
        selectSelectedAccount: SuiteCompatibleSelector<SelectedAccountStatus>;
        selectSelectedAccountStatus: SuiteCompatibleSelector<SelectedAccountStatus['status']>;
        selectTradingEnvironment: SuiteCompatibleSelector<
            'production' | 'staging' | 'dev' | 'localhost' | undefined
        >;
        selectTradedAccountKeys: SuiteCompatibleSelector<AccountKey[]>;
        selectIsViewOnlyByDefaultEnabled: SuiteCompatibleSelector<boolean>;
        selectThpSettings: SuiteCompatibleSelector<ThpSettings>;
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
        storageLoadPhishingMetadata: StorageLoadReducer;
        storageLoadHistoricRates: StorageLoadReducer;
        setDeviceMetadataReducer: BaseReducer;
        setDeviceMetadataPasswordsReducer: BaseReducer;
        storageLoadDevices: StorageLoadReducer;
        storageLoadFormDrafts: StorageLoadReducer;
        storageLoadTokenManagement: StorageLoadReducer;
        storageLoadWalletSettings: StorageLoadReducer;
        storageLoadBioAuth: StorageLoadReducer;
        storageLoadFlags: StorageLoadReducer;
        storageLoadSuiteSettings: StorageLoadReducer;
        storageLoadReceiveAccounts: StorageLoadReducer;
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
