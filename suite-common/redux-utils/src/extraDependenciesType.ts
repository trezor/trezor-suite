import {
    ActionCreatorWithoutPayload,
    ActionCreatorWithPayload,
    ActionCreatorWithPreparedPayload,
} from '@reduxjs/toolkit';

import { Account, Discovery, FeeInfo } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TrezorDevice, UserContextPayload } from '@suite-common/suite-types';
import { BlockchainBlock, ConnectSettings, Manifest, PROTO } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';

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
    };
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => SuiteCompatibleSelector<FeeInfo>;
        selectDevices: SuiteCompatibleSelector<TrezorDevice[]>;
        selectCurrentDevice: SuiteCompatibleSelector<TrezorDevice | undefined>;
        selectBitcoinAmountUnit: SuiteCompatibleSelector<PROTO.AmountUnit>;
        selectEnabledNetworks: SuiteCompatibleSelector<NetworkSymbol[]>;
        selectLocalCurrency: SuiteCompatibleSelector<FiatCurrencyCode>;
        selectIsPendingTransportEvent: SuiteCompatibleSelector<boolean>;
        // todo: we do not want to, so far, transfer coinjoin to @suite-common
        // but this is exactly what I need to get DebugModeOptions type instead of any
        selectDebugSettings: SuiteCompatibleSelector<any>;
        selectDesktopBinDir: SuiteCompatibleSelector<string | undefined>;
        selectDevice: SuiteCompatibleSelector<TrezorDevice | undefined>;
        selectRouterApp: SuiteCompatibleSelector<string>;
        selectMetadata: SuiteCompatibleSelector<any>;
        selectDiscoveryForDevice: SuiteCompatibleSelector<Discovery | undefined>;
        selectCheckFirmwareAuthenticity: SuiteCompatibleSelector<boolean>;
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
        addButtonRequest: ActionType;
        setDeviceMetadata: ActionType;
    };
    reducers: {
        storageLoadBlockchain: StorageLoadReducer;
        storageLoadAccounts: StorageLoadReducer;
        storageLoadTransactions: StorageLoadTransactionsReducer;
        storageLoadFirmware: StorageLoadReducer;
        storageLoadDiscovery: StorageLoadReducer;
        addButtonRequestFirmware: AddButtonRequestReducer;
        setDeviceMetadataReducer: BaseReducer;
        storageLoadDevices: StorageLoadReducer;
    };
    utils: {
        saveAs: (data: Blob, fileName: string) => void;
        connectInitSettings: ConnectInitSettings;
    };
};

export type ExtraDependenciesPartial = {
    [K in keyof ExtraDependencies]?: Partial<ExtraDependencies[K]>;
};
