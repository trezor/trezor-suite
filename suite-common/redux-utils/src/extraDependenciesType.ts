import {
    ActionCreatorWithPayload,
    ActionCreatorWithPreparedPayload,
    ActionCreatorWithoutPayload,
} from '@reduxjs/toolkit';

import { MetadataAddPayload } from '@suite-common/metadata-types';
import { Route, TrezorDevice, UserContextPayload } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    Account,
    AddressDisplayOptions,
    SelectedAccountStatus,
    WalletType,
} from '@suite-common/wallet-types';
import { BlockchainBlock, ConnectSettings, Manifest, StaticSessionId } from '@trezor/connect';

import { ActionType, SuiteCompatibleSelector, SuiteCompatibleThunk } from './types';

type BaseReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadTransactionsReducer = (state: any, action: { type: any; payload: any }) => void;

type ConnectInitSettings = {
    manifest: Manifest;
} & Partial<ConnectSettings>;

export type ExtraDependencies = {
    thunks: {
        cardanoValidatePendingTxOnBlock: SuiteCompatibleThunk<{
            block: BlockchainBlock;
            timestamp: number;
        }>;
        cardanoFetchTrezorData: SuiteCompatibleThunk<'tADA' | 'ADA'>;
        initMetadata: SuiteCompatibleThunk<boolean>;
        fetchAndSaveMetadata: SuiteCompatibleThunk<StaticSessionId>;
        addAccountMetadata: SuiteCompatibleThunk<
            Exclude<MetadataAddPayload, { type: 'walletLabel' }>
        >;
        forgetBluetoothDevice: SuiteCompatibleThunk<{ bluetoothId: string }>;
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
        selectSuiteSettings: SuiteCompatibleSelector<{
            defaultWalletLoading: WalletType;
        }>;
        selectTradingEnvironment: SuiteCompatibleSelector<
            'production' | 'staging' | 'dev' | 'localhost' | undefined
        >;
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
    };
    utils: {
        saveAs: (data: Blob, fileName: string) => void;
        connectInitSettings: ConnectInitSettings;
        reportCheckFail: (
            checkType: 'Entropy' | 'Firmware hash' | 'Firmware revision' | 'Firmware version',
            contextData: Record<string, any>,
            errorPayload?: unknown,
        ) => void;
    };
};

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
