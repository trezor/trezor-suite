import { saveAs } from 'file-saver';
import { PayloadAction } from '@reduxjs/toolkit';

import { resolveStaticPath } from '@suite-common/suite-utils';
import { getAccountKey } from '@suite-common/wallet-utils';
import {
    DeviceRootState,
    selectIsPendingTransportEvent,
    TransactionsState,
    BlockchainState,
    DiscoveryRootState,
    selectDiscoveryByDeviceState,
    deviceActions,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { ExtraDependencies } from '@suite-common/redux-utils';

import { StorageLoadAction } from 'src/actions/suite/storageActions';
import * as metadataActions from 'src/actions/suite/metadataActions';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { fixLoadedCoinjoinAccount } from 'src/utils/wallet/coinjoinUtils';
import * as modalActions from 'src/actions/suite/modalActions';

import * as suiteActions from '../actions/suite/suiteActions';
import { AppState, ButtonRequest, TrezorDevice } from '../types/suite';
import { METADATA, STORAGE } from '../actions/suite/constants';

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
        initMetadata: metadataActions.init,
        fetchAndSaveMetadata: metadataActions.fetchAndSaveMetadata,
    },
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => (state: AppState) =>
            state.wallet.fees[networkSymbol],
        selectDevices: (state: AppState) => state.device.devices,
        selectBitcoinAmountUnit: (state: AppState) => state.wallet.settings.bitcoinAmountUnit,
        selectEnabledNetworks: (state: AppState) => state.wallet.settings.enabledNetworks,
        selectLocalCurrency: (state: AppState) => state.wallet.settings.localCurrency,
        selectIsPendingTransportEvent,
        selectDebugSettings: (state: AppState) => state.suite.settings.debug,
        selectDesktopBinDir: (state: AppState) => state.desktop?.paths?.binDir,
        selectDevice: (state: AppState) => state.device.selectedDevice,
        selectMetadata: (state: AppState) => state.metadata,
        selectDeviceDiscovery: (state: DiscoveryRootState & DeviceRootState) =>
            selectDiscoveryByDeviceState(state, state.device.selectedDevice?.state),
        selectRouterApp: (state: AppState) => state.router.app,
        selectCheckFirmwareAuthenticity: (state: AppState) =>
            state.suite.settings.debug.checkFirmwareAuthenticity,
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
        addButtonRequest: deviceActions.addButtonRequest.type,
        setDeviceMetadata: METADATA.SET_DEVICE_METADATA,
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
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex((d: TrezorDevice) => d.state === deviceState);
            const device = state.devices[index];
            if (!device) return;
            device.metadata = metadata;
        },
        storageLoadDevices: (state, { payload }: StorageLoadAction) => {
            state.devices = payload.devices;
        },
    },
    utils: {
        saveAs: (data, fileName) => saveAs(data, fileName),
        connectInitSettings,
    },
};
