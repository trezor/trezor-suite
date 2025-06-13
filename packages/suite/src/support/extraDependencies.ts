import { PayloadAction } from '@reduxjs/toolkit';
import { saveAs } from 'file-saver';

import { ExtraDependencies } from '@suite-common/redux-utils';
import {
    TokenDefinitionsState,
    buildTokenDefinitionsFromStorage,
} from '@suite-common/token-definitions';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import {
    BlockchainState,
    ExplorerConfig,
    FiatRatesState,
    TransactionsState,
} from '@suite-common/wallet-core';
import { buildHistoricRatesFromStorage, getAccountKey } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';

import * as metadataActions from 'src/actions/suite/metadataActions';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import * as modalActions from 'src/actions/suite/modalActions';
import { StorageLoadAction } from 'src/actions/suite/storageActions';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import { reportCheckFail } from 'src/components/suite/SecurityCheck/useReportDeviceCompromised';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { fixLoadedCoinjoinAccount } from 'src/utils/wallet/coinjoinUtils';

import { forgetBluetoothDevice } from '../actions/bluetooth/bluetoothEraseBondsThunk';
import * as suiteActions from '../actions/suite/suiteActions';
import type { BioAuthState } from '../reducers/bioAuth';
import { selectSuiteSettings } from '../reducers/suite/suiteReducer';
import { AppState, TrezorDevice } from '../types/suite';

const connectSrc = '../';
// 'https://localhost:8088/';
// 'https://connect.corp.sldev.cz/develop/';

const connectInitSettings = {
    connectSrc,
    transportReconnect: true,
    debug: false,
    popup: false,
    manifest: {
        email: 'info@trezor.io',
        appName: isDesktop() ? 'Trezor Suite desktop' : 'Trezor Suite web',
        appUrl: isDesktop() ? 'Trezor Suite desktop' : window.origin,
    },
    sharedLogger: false,
    enableFirmwareHashCheck: true,
};

export const extraDependencies: ExtraDependencies = {
    thunks: {
        cardanoValidatePendingTxOnBlock: cardanoStakingActions.validatePendingTxOnBlock,
        cardanoFetchTrezorData: cardanoStakingActions.fetchTrezorData,
        initMetadata: metadataLabelingActions.init,
        fetchAndSaveMetadata: metadataLabelingActions.fetchAndSaveMetadata,
        addAccountMetadata: metadataLabelingActions.addAccountMetadata,
        forgetBluetoothDevice,
    },
    selectors: {
        selectTokenDefinitionsEnabledNetworks: (state: AppState) =>
            state.wallet.settings.enabledNetworks,
        selectDebugSettings: (state: AppState) => state.suite.settings.debug,
        // FW binaries on desktop are stored in "*/static/connect/data/firmware/*/*.bin" (see "connect-common" package)
        selectDesktopBinDir: (state: AppState) => state.desktop?.paths?.binDir,
        selectDevice: (state: AppState) => state.device.selectedDevice,
        selectLanguage: (state: AppState) => state.suite.settings.language,
        selectMetadata: (state: AppState) => state.metadata,
        selectRouterApp: (state: AppState) => state.router.app,
        selectRoute: (state: AppState) => state.router.route,
        selectAddressDisplayType: (state: AppState) => state.suite.settings.addressDisplayType,
        selectSelectedAccount: (state: AppState) => state.wallet.selectedAccount,
        selectSelectedAccountStatus: (state: AppState) => state.wallet.selectedAccount.status,
        selectSuiteSettings,
        selectIsWindowVisible,
        selectTradingEnvironment: (state: AppState) =>
            state.suite.settings.debug.invityServerEnvironment,
    },
    actions: {
        setAccountAddMetadata: metadataActions.setAccountAdd,
        lockDevice: suiteActions.lockDevice,
        onModalCancel: modalActions.onCancel,
        openModal: modalActions.openModal,
    },
    actionTypes: {
        storageLoad: '@storage/load',
        setDeviceMetadata: '@metadata/set-device-metadata',
        setDeviceMetadataPasswords: '@metadata/set-device-metadata-passwords',
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
        storageLoadExplorer: (state: ExplorerConfig, { payload }: StorageLoadAction) => {
            payload.explorer.forEach(({ symbol, explorer }) => {
                state[symbol] = {
                    ...state[symbol],
                    custom: explorer,
                };
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
                Object.keys(tokenDefinitions).forEach(symbol => {
                    if (isNetworkSymbol(symbol)) {
                        state[symbol] = tokenDefinitions[symbol];
                    }
                });
            }
        },
        storageLoadAccounts: (_, { payload }: StorageLoadAction) =>
            payload.accounts.map(acc =>
                acc.backendType === 'coinjoin' ? fixLoadedCoinjoinAccount(acc) : acc,
            ),
        setDeviceMetadataReducer: (
            state,
            {
                payload,
            }: PayloadAction<{ deviceState: StaticSessionId; metadata: TrezorDevice['metadata'] }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex(
                (d: TrezorDevice) => d.state?.staticSessionId === deviceState,
            );
            const device = state.devices[index];
            if (!device) return;
            device.metadata = metadata;
        },
        setDeviceMetadataPasswordsReducer: (
            state,
            {
                payload,
            }: PayloadAction<{
                deviceState: StaticSessionId;
                metadata: TrezorDevice['passwords'];
            }>,
        ) => {
            const { deviceState, metadata } = payload;
            const index = state.devices.findIndex(
                (d: TrezorDevice) => d.state?.staticSessionId === deviceState,
            );
            const device = state.devices[index];
            if (!device) return;
            device.passwords = metadata;
        },
        storageLoadDevices: (state, { payload }: StorageLoadAction) => {
            state.devices = payload.devices;
            state.devicesWithFailedEntropyCheck = payload.security?.devicesWithFailedEntropyCheck;
        },
        storageLoadFormDrafts: (state, { payload }: StorageLoadAction) => {
            payload.sendFormDrafts.forEach(d => {
                state.drafts[d.key] = d.value;
            });
        },
        storageLoadWalletSettings: (state, { payload }: StorageLoadAction) =>
            payload.walletSettings || state,
        storageLoadBioAuth: (state: BioAuthState, { payload }: StorageLoadAction) => {
            if (!payload?.bioAuth) return state;

            // Only load the bioAuthEnabled property, ignore all other properties
            if (payload.bioAuth.bioAuthEnabled !== undefined) {
                return {
                    ...state,
                    bioAuthEnabled: payload.bioAuth.bioAuthEnabled,
                };
            }

            return state;
        },
    },
    utils: {
        saveAs: (data, fileName) => saveAs(data, fileName),
        connectInitSettings,
        reportCheckFail,
    },
};
