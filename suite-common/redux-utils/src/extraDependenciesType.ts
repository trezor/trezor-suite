import {
    ActionCreatorWithoutPayload,
    ActionCreatorWithPayload,
    ActionCreatorWithPreparedPayload,
} from '@reduxjs/toolkit';

import {
    Account,
    AccountKey,
    AddressDisplayOptions,
    Discovery,
    FeeInfo,
    SelectedAccountStatus,
    WalletAccountTransaction,
    WalletType,
} from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AcquiredDevice, Route, TrezorDevice, UserContextPayload } from '@suite-common/suite-types';
import { BlockchainBlock, ConnectSettings, Manifest, PROTO } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { MetadataAddPayload } from '@suite-common/metadata-types';

import { ActionType, SuiteCompatibleSelector, SuiteCompatibleThunk } from './types';

type BaseReducer = (state: any, action: { type: any; payload: any }) => void;
type StorageLoadReducer = (state: any, action: { type: any; payload: any }) => void;
type AddButtonRequestReducer = (state: any, action: { type: any; payload: any }) => void;
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
        cardanoFetchTrezorPools: SuiteCompatibleThunk<'tADA' | 'ADA'>;
        initMetadata: SuiteCompatibleThunk<boolean>;
        fetchAndSaveMetadata: SuiteCompatibleThunk<string>;
        addAccountMetadata: SuiteCompatibleThunk<
            Exclude<MetadataAddPayload, { type: 'walletLabel' }>
        >;
        findLabelsToBeMovedOrDeleted: SuiteCompatibleThunk<{
            prevTxid: string;
        }>;
        moveLabelsForRbfAction: SuiteCompatibleThunk<{
            newTxid: string;
            toBeMovedOrDeletedList: Record<
                AccountKey,
                {
                    toBeMoved: WalletAccountTransaction;
                    toBeDeleted: WalletAccountTransaction[];
                }
            >;
        }>;
        openSwitchDeviceDialog: SuiteCompatibleThunk<void>;
        addWalletThunk: SuiteCompatibleThunk<{ walletType: WalletType; device: AcquiredDevice }>;
    };
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => SuiteCompatibleSelector<FeeInfo>;
        selectDevices: SuiteCompatibleSelector<TrezorDevice[]>;
        selectBitcoinAmountUnit: SuiteCompatibleSelector<PROTO.AmountUnit>;
        selectAreSatsAmountUnit: SuiteCompatibleSelector<boolean>;
        selectEnabledNetworks: SuiteCompatibleSelector<NetworkSymbol[]>;
        selectLocalCurrency: SuiteCompatibleSelector<FiatCurrencyCode>;
        selectIsPendingTransportEvent: SuiteCompatibleSelector<boolean>;
        // todo: we do not want to, so far, transfer coinjoin to @suite-common
        // but this is exactly what I need to get DebugModeOptions type instead of any
        selectDebugSettings: SuiteCompatibleSelector<any>;
        selectDesktopBinDir: SuiteCompatibleSelector<string | undefined>;
        selectDevice: SuiteCompatibleSelector<TrezorDevice | undefined>;
        selectLanguage: SuiteCompatibleSelector<string>;
        selectRouterApp: SuiteCompatibleSelector<string>;
        selectRoute: SuiteCompatibleSelector<Route | undefined>;
        selectMetadata: SuiteCompatibleSelector<any>;
        selectDeviceDiscovery: SuiteCompatibleSelector<Discovery | undefined>;
        selectCheckFirmwareAuthenticity: SuiteCompatibleSelector<boolean>;
        selectAddressDisplayType: SuiteCompatibleSelector<AddressDisplayOptions>;
        selectSelectedAccountStatus: SuiteCompatibleSelector<SelectedAccountStatus['status']>;
        selectSuiteSettings: SuiteCompatibleSelector<{
            defaultWalletLoading: WalletType;
            isViewOnlyModeVisible: boolean;
        }>;
    };
    // You should only use ActionCreatorWithPayload from redux-toolkit!
    // That means you will need to convert actual action creators in packages/suite to use createAction from redux-toolkit,
    // but that shouldn't be problem.
    actions: {
        setAccountAddMetadata: ActionCreatorWithPreparedPayload<[payload: Account], Account>;
        setWalletSettingsLocalCurrency:
            | ActionCreatorWithPreparedPayload<
                  [localCurrency: FiatCurrencyCode],
                  {
                      localCurrency: FiatCurrencyCode;
                  }
              >
            | ActionCreatorWithPayload<{
                  localCurrency: FiatCurrencyCode;
              }>;
        lockDevice: ActionCreatorWithPreparedPayload<[payload: boolean], boolean>;
        appChanged: ActionCreatorWithPayload<unknown>;
        setSelectedDevice: ActionCreatorWithPayload<TrezorDevice | undefined>;
        updateSelectedDevice: ActionCreatorWithPayload<TrezorDevice | undefined>;
        requestAuthConfirm: ActionCreatorWithoutPayload;
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
        storageLoadAccounts: StorageLoadReducer;
        storageLoadTransactions: StorageLoadTransactionsReducer;
        storageLoadHistoricRates: StorageLoadReducer;
        storageLoadFirmware: StorageLoadReducer;
        storageLoadDiscovery: StorageLoadReducer;
        addButtonRequestFirmware: AddButtonRequestReducer;
        setDeviceMetadataReducer: BaseReducer;
        setDeviceMetadataPasswordsReducer: BaseReducer;
        storageLoadDevices: StorageLoadReducer;
        storageLoadFormDrafts: StorageLoadReducer;
        storageLoadTokenManagement: StorageLoadReducer;
    };
    utils: {
        saveAs: (data: Blob, fileName: string) => void;
        connectInitSettings: ConnectInitSettings;
    };
};

export type ExtraDependenciesPartial = {
    [K in keyof ExtraDependencies]?: Partial<ExtraDependencies[K]>;
};

export type CustomThunkAPI = {
    state: any;
    extra: ExtraDependencies;
};
