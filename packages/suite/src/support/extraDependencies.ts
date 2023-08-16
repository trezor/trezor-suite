import { saveAs } from 'file-saver';
import { PayloadAction } from '@reduxjs/toolkit';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { getAccountKey } from '@suite-common/wallet-utils';
import type { FiatRatesState } from '@suite-common/wallet-core';
import {
    TransactionsState,
    BlockchainState,
    DiscoveryRootState,
    selectDiscoveryByDeviceState,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { ExtraDependencies } from '@suite-common/redux-utils';

import { StorageLoadAction } from 'src/actions/suite/storageActions';
import * as metadataActions from 'src/actions/suite/metadataActions';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { selectIsPendingTransportEvent } from 'src/reducers/suite/deviceReducer';
import { fixLoadedCoinjoinAccount } from 'src/utils/wallet/coinjoinUtils';

import * as suiteActions from '../actions/suite/suiteActions';
import { AppState, ButtonRequest, TrezorDevice } from '../types/suite';
import { METADATA, STORAGE, SUITE } from '../actions/suite/constants';
import { SuiteState } from '../reducers/suite/suiteReducer';
import * as deviceUtils from '../utils/suite/device';

const connectSrc = resolveStaticPath('connect/');
// 'https://localhost:8088/';
// 'https://connect.corp.sldev.cz/develop/';

const connectInitSettings = {
    connectSrc,
    transportReconnect: true,
    debug: false,
    popup: false,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};

export const extraDependencies: ExtraDependencies = {
    thunks: {
        cardanoValidatePendingTxOnBlock: cardanoStakingActions.validatePendingTxOnBlock,
        cardanoFetchTrezorPools: cardanoStakingActions.fetchTrezorPools,
        initMetadata: metadataActions.init,
        fetchMetadata: metadataActions.fetchMetadata,
    },
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => (state: AppState) =>
            state.wallet.fees[networkSymbol],
        selectDevices: (state: AppState) => state.devices,
        selectCurrentDevice: (state: AppState) => state.suite.device,
        selectBitcoinAmountUnit: (state: AppState) => state.wallet.settings.bitcoinAmountUnit,
        selectEnabledNetworks: (state: AppState) => state.wallet.settings.enabledNetworks,
        selectLocalCurrency: (state: AppState) => state.wallet.settings.localCurrency,
        selectIsPendingTransportEvent,
        selectDebugSettings: (state: AppState) => state.suite.settings.debug,
        selectDesktopBinDir: (state: AppState) => state.desktop?.paths?.binDir,
        selectDevice: (state: AppState) => state.suite.device,
        selectMetadata: (state: AppState) => state.metadata,
        selectDiscoveryForDevice: (state: DiscoveryRootState & { suite: SuiteState }) =>
            selectDiscoveryByDeviceState(state, state.suite.device?.state),
        selectRouterApp: (state: AppState) => state.router.app,
    },
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        setWalletSettingsLocalCurrency: walletSettingsActions.setLocalCurrency,
        changeWalletSettingsNetworks: walletSettingsActions.changeNetworks,
        lockDevice: suiteActions.lockDevice,
        appChanged: suiteActions.appChanged,
        setSelectedDevice: suiteActions.setSelectedDevice,
        updateSelectedDevice: suiteActions.updateSelectedDevice,
        requestAuthConfirm: suiteActions.requestAuthConfirm,
    },
    actionTypes: {
        storageLoad: STORAGE.LOAD,
        addButtonRequest: SUITE.ADD_BUTTON_REQUEST,
        setDeviceMetadata: METADATA.SET_DEVICE_METADATA,
        suiteSelectDevice: SUITE.SELECT_DEVICE,
        suiteUpdatePassphraseMode: SUITE.UPDATE_PASSPHRASE_MODE,
        suiteAuthFailed: SUITE.AUTH_FAILED,
        suiteAuthDevice: SUITE.AUTH_DEVICE,
        suiteReceiveAuthConfirm: SUITE.RECEIVE_AUTH_CONFIRM,
    },
    reducers: {
        storageLoadBlockchain: (state: BlockchainState, { payload }: StorageLoadAction) => {
            payload.backendSettings.forEach(backend => {
                const blockchain = state[backend.key];
                if (blockchain) {
                    blockchain.backends = backend.value;
                }
            });
        },
        storageLoadTransactions: (state: TransactionsState, { payload }: StorageLoadAction) => {
            const { txs } = payload;
            txs.forEach(item => {
                const k = getAccountKey(item.tx.descriptor, item.tx.symbol, item.tx.deviceState);
                if (!state.transactions[k]) {
                    state.transactions[k] = [];
                }
                state.transactions[k][item.order] = item.tx;
            });
        },
        storageLoadAccounts: (_, { payload }: StorageLoadAction) =>
            payload.accounts.map(acc =>
                acc.backendType === 'coinjoin' ? fixLoadedCoinjoinAccount(acc) : acc,
            ),
        storageLoadFiatRates: (state: FiatRatesState, { payload }: StorageLoadAction) => {
            state.coins = payload.fiatRates;
        },
        storageLoadFirmware: (state, { payload }: StorageLoadAction) => {
            if (payload.firmware?.firmwareHashInvalid) {
                state.firmwareHashInvalid = payload.firmware.firmwareHashInvalid;
            }
        },
        storageLoadDiscovery: (_, { payload }: StorageLoadAction) => payload.discovery,
        addButtonRequestFirmware: (
            state,
            {
                payload,
            }: PayloadAction<{
                device?: TrezorDevice;
                buttonRequest: ButtonRequest;
            }>,
        ) => {
            if (payload.buttonRequest?.code === 'ButtonRequest_FirmwareUpdate') {
                state.status = 'waiting-for-confirmation';
            }
        },
        setDeviceMetadataReducer: (
            state,
            { payload }: PayloadAction<{ deviceState: string; metadata: TrezorDevice['metadata'] }>,
        ) => {
            const index = state.findIndex((d: TrezorDevice) => d.state === payload.deviceState);
            const device = state[index];
            if (!device) return;
            device.metadata = payload.metadata;
        },
        suiteSelectDeviceReducer: (state, { payload }: PayloadAction<TrezorDevice | undefined>) => {
            // only acquired devices
            if (!payload || !payload.features) return;
            const index = deviceUtils.findInstanceIndex(state, payload);
            if (!state[index]) return;
            // update timestamp
            state[index].ts = new Date().getTime();
        },
        updatePassphraseModeReducer: (
            state,
            {
                payload,
                hidden,
                alwaysOnDevice,
            }: PayloadAction<TrezorDevice> & { hidden: boolean; alwaysOnDevice: boolean },
        ) => {
            // only acquired devices
            if (!payload || !payload.features) return;
            const index = deviceUtils.findInstanceIndex(state, payload);
            if (!state[index]) return;
            // update fields
            state[index].useEmptyPassphrase = !hidden;
            state[index].passphraseOnDevice = alwaysOnDevice;
            state[index].ts = new Date().getTime();
            if (hidden && typeof state[index].walletNumber !== 'number') {
                state[index].walletNumber = deviceUtils.getNewWalletNumber(state, state[index]);
            }
            if (!hidden && typeof state[index].walletNumber === 'number') {
                delete state[index].walletNumber;
            }
        },
        suiteAuthFailedReducer: (state, { payload }: PayloadAction<TrezorDevice>) => {
            // only acquired devices
            if (!payload || !payload.features) return;
            const index = deviceUtils.findInstanceIndex(state, payload);
            if (!state[index]) return;
            state[index].authFailed = true;
        },
        suiteAuthDeviceReducer: (
            state,
            action: PayloadAction<TrezorDevice> & { state: string },
        ) => {
            // only acquired devices
            if (!action.payload || !action.payload.features) return;
            const index = deviceUtils.findInstanceIndex(state, action.payload);
            if (!state[index]) return;
            // update state
            state[index].state = action.state;
            delete state[index].authFailed;
        },
        suiteReceiveAuthConfirmReducer: (
            state,
            { payload, success }: PayloadAction<TrezorDevice> & { success: boolean },
        ) => {
            // only acquired devices
            if (!payload || !payload.features) return;
            const index = deviceUtils.findInstanceIndex(state, payload);
            if (!state[index]) return;
            // update state
            state[index].authConfirm = !success;
            state[index].available = success;
        },
    },
    utils: {
        saveAs: (data, fileName) => saveAs(data, fileName),
        connectInitSettings,
    },
};
