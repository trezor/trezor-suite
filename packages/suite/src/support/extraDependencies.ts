import { saveAs } from 'file-saver';
import { PayloadAction } from '@reduxjs/toolkit';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { getAccountKey, buildHistoricRatesFromStorage } from '@suite-common/wallet-utils';
import {
    DeviceRootState,
    selectIsPendingTransportEvent,
    TransactionsState,
    BlockchainState,
    DiscoveryRootState,
    selectDiscoveryByDeviceState,
    deviceActions,
    FiatRatesState,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { ExtraDependencies } from '@suite-common/redux-utils';
import {
    findLabelsToBeMovedOrDeleted,
    moveLabelsForRbfAction,
} from 'src/actions/wallet/moveLabelsForRbfActions';

import { StorageLoadAction } from 'src/actions/suite/storageActions';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import * as metadataActions from 'src/actions/suite/metadataActions';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { fixLoadedCoinjoinAccount } from 'src/utils/wallet/coinjoinUtils';
import * as modalActions from 'src/actions/suite/modalActions';

import * as suiteActions from '../actions/suite/suiteActions';
import { AppState, ButtonRequest, TrezorDevice } from '../types/suite';
import { METADATA, STORAGE } from '../actions/suite/constants';
import { PROTO, StaticSessionId } from '@trezor/connect';
import {
    TokenDefinitionsState,
    buildTokenDefinitionsFromStorage,
} from '@suite-common/token-definitions';
import { selectSuiteSettings } from '../reducers/suite/suiteReducer';
import { addWalletThunk, openSwitchDeviceDialog } from 'src/actions/wallet/addWalletThunk';

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
    sharedLogger: false,
};

export const extraDependencies: ExtraDependencies = {
    thunks: {
        cardanoValidatePendingTxOnBlock: cardanoStakingActions.validatePendingTxOnBlock,
        cardanoFetchTrezorPools: cardanoStakingActions.fetchTrezorPools,
        initMetadata: metadataLabelingActions.init,
        fetchAndSaveMetadata: metadataLabelingActions.fetchAndSaveMetadata,
        addAccountMetadata: metadataLabelingActions.addAccountMetadata,
        findLabelsToBeMovedOrDeleted,
        moveLabelsForRbfAction,
        openSwitchDeviceDialog,
        addWalletThunk,
    },
    selectors: {
        selectDevices: (state: AppState) => state.device.devices,
        selectBitcoinAmountUnit: (state: AppState) => state.wallet.settings.bitcoinAmountUnit,
        selectAreSatsAmountUnit: (state: AppState) =>
            state.wallet.settings.bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI,
        selectEnabledNetworks: (state: AppState) => state.wallet.settings.enabledNetworks,
        selectTokenDefinitionsEnabledNetworks: (state: AppState) =>
            state.wallet.settings.enabledNetworks,
        selectLocalCurrency: (state: AppState) => state.wallet.settings.localCurrency,
        selectIsPendingTransportEvent,
        selectDebugSettings: (state: AppState) => state.suite.settings.debug,
        selectDesktopBinDir: (state: AppState) => state.desktop?.paths?.binDir,
        selectDevice: (state: AppState) => state.device.selectedDevice,
        selectLanguage: (state: AppState) => state.suite.settings.language,
        selectMetadata: (state: AppState) => state.metadata,
        selectDeviceDiscovery: (state: DiscoveryRootState & DeviceRootState) =>
            selectDiscoveryByDeviceState(state, state.device.selectedDevice?.state),
        selectRouterApp: (state: AppState) => state.router.app,
        selectRoute: (state: AppState) => state.router.route,
        selectCheckFirmwareAuthenticity: (state: AppState) =>
            state.suite.settings.debug.checkFirmwareAuthenticity,
        selectAddressDisplayType: (state: AppState) => state.suite.settings.addressDisplayType,
        selectSelectedAccountStatus: (state: AppState) => state.wallet.selectedAccount.status,
        selectSuiteSettings,
    },
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        setWalletSettingsLocalCurrency: walletSettingsActions.setLocalCurrency,
        lockDevice: suiteActions.lockDevice,
        appChanged: suiteActions.appChanged,
        setSelectedDevice: deviceActions.selectDevice,
        updateSelectedDevice: deviceActions.updateSelectedDevice,
        requestAuthConfirm: suiteActions.requestAuthConfirm,
        onModalCancel: modalActions.onCancel,
        openModal: modalActions.openModal,
    },
    actionTypes: {
        storageLoad: STORAGE.LOAD,
        setDeviceMetadata: METADATA.SET_DEVICE_METADATA,
        setDeviceMetadataPasswords: METADATA.SET_DEVICE_METADATA_PASSWORDS,
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
        storageLoadHistoricRates: (state: FiatRatesState, { payload }: StorageLoadAction) => {
            if (payload.historicRates) {
                const fiatRates = payload.historicRates.map(rate => rate.value);
                const historicRates = buildHistoricRatesFromStorage(fiatRates);
                state.historic = historicRates;
            }
        },
        storageLoadTokenManagement: (
            state: TokenDefinitionsState,
            { payload }: StorageLoadAction,
        ) => {
            if (payload.tokenManagement) {
                const tokenDefinitions = buildTokenDefinitionsFromStorage(payload.tokenManagement);
                Object.keys(tokenDefinitions).forEach(networkSymbol => {
                    const symbol = networkSymbol as NetworkSymbol;
                    state[symbol] = tokenDefinitions[symbol];
                });
            }
        },
        storageLoadAccounts: (_, { payload }: StorageLoadAction) =>
            payload.accounts.map(acc =>
                acc.backendType === 'coinjoin' ? fixLoadedCoinjoinAccount(acc) : acc,
            ),
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
            {
                payload,
            }: PayloadAction<{ deviceState: StaticSessionId; metadata: TrezorDevice['metadata'] }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex((d: TrezorDevice) => d.state === deviceState);
            const device = state.devices[index];
            if (!device) return;
            device.metadata = metadata;
        },
        setDeviceMetadataPasswordsReducer: (
            state,
            {
                payload,
            }: PayloadAction<{ deviceState: StaticSessionId; metadata: TrezorDevice['passwords'] }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex((d: TrezorDevice) => d.state === deviceState);
            const device = state.devices[index];
            if (!device) return;
            device.passwords = metadata;
        },
        storageLoadDevices: (state, { payload }: StorageLoadAction) => {
            state.devices = payload.devices;
        },
        storageLoadFormDrafts: (state, { payload }: StorageLoadAction) => {
            payload.sendFormDrafts.forEach(d => {
                state.drafts[d.key] = d.value;
            });
        },
    },
    utils: {
        saveAs: (data, fileName) => saveAs(data, fileName),
        connectInitSettings,
    },
};
