import {
    type Action,
    type ActionCreatorWithPreparedPayload,
    type AsyncThunk,
    type ThunkAction,
} from '@reduxjs/toolkit';

import type { AddressValidatorDep } from '@suite-common/address';
import type { AnalyticsDep } from '@suite-common/analytics';
import { type Bip329Dep } from '@suite-common/bip329-types';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type Getter } from '@suite-common/dependency-injection';
import {
    type FetchAndSaveMetadataDep,
    type MetadataAddPayload,
} from '@suite-common/metadata-types';
import type {
    FindNetworkSymbolForProtocolDep,
    GetNetworkConfigDep,
    NetworkModuleRepositoryDep,
} from '@suite-common/networks';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type MigrateSuiteSyncLabelsForRbfTransactionDep } from '@suite-common/suite-rbf-labels-migrations-types';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import {
    type ConnectInitHooksDeps,
    type GetAllowPrereleaseDep,
    type GetIsWindowVisibleDep,
    type GetLanguageDep,
    type OnModalCancelDep,
    type OpenModalDep,
    type ReloadAppDep,
    type ReportSecurityCheckDep,
} from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type GetTradedAccountKeysDep,
    type SelectedAccountStatus,
} from '@suite-common/wallet-types';
import {
    type BluetoothDeviceId,
    type ConnectSettings,
    type CreateLogger,
    type CreateLoggerDep,
    type Manifest,
    type ThpSettings,
} from '@trezor/connect';
import type { Transport } from '@trezor/transport-common';
import { type KeyedThrottle } from '@trezor/utils';

interface AnyAction extends Action {
    [extraProps: string]: any;
}

type OriginalReduxThunk<TPayload, TReturn = void> = (
    payload: TPayload,
) => ThunkAction<TReturn, any, any, AnyAction>;

type SuiteCompatibleThunk<TPayload, TReturn = void> =
    | AsyncThunk<TReturn, TPayload, Record<never, never>>
    | OriginalReduxThunk<TPayload, TReturn>;

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
    GetNetworkConfigDep &
    FindNetworkSymbolForProtocolDep &
    NetworkModuleRepositoryDep &
    Bip329Dep &
    EnsureDelegatedIdentityKeyDep &
    PlatformEncryptionDep &
    AnalyticsDep &
    ConnectInitHooksDeps &
    GetAllowPrereleaseDep &
    GetIsWindowVisibleDep &
    GetLanguageDep &
    GetTradedAccountKeysDep & {
        saveAs: (data: Blob, fileName: string) => void;
        connectInitSettings: ConnectInitSettings;
        accountRefreshThrottle: KeyedThrottle<Account['key']>;
        // Getters, so a component cannot read them during render and miss later state changes.
        // See `toGetter`/`useGetter` in @suite-common/dependency-injection.
        getTokenDefinitionsEnabledNetworks: Getter<[], NetworkSymbol[]>;
        getDebugSettings: Getter<[], any>;
        getDesktopBinDir: Getter<[], string | undefined>;
        getSelectedAccount: Getter<[], SelectedAccountStatus>;
        getSelectedAccountStatus: Getter<[], SelectedAccountStatus['status']>;
        getTradingEnvironment: Getter<
            [],
            'production' | 'staging' | 'dev' | 'localhost' | undefined
        >;
        getIsViewOnlyByDefaultEnabled: Getter<[], boolean>;
        getThpSettings: Getter<[], ThpSettings>;
    } & ReportSecurityCheckDep &
    ReloadAppDep &
    MigrateSuiteSyncLabelsForRbfTransactionDep &
    CreateLoggerDep &
    ThpHostNameDep &
    TransportsDep;

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
