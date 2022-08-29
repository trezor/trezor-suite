import { ExtraDependencies } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TransactionsState } from '@suite-common/wallet-core';
import { saveAs } from 'file-saver';

import { STORAGE } from '../actions/suite/constants';
import { addEvent } from '@suite-actions/notificationActions';
import { StorageLoadAction } from '@suite-actions/storageActions';
import type { BlockchainState } from '@wallet-reducers/blockchainReducer';
import { AppState } from '../types/suite';
import { getAccountKey } from '@suite-common/wallet-utils';
import * as fiatRatesActions from '@wallet-actions/fiatRatesActions';
import * as metadataActions from '@suite-actions/metadataActions';
import { selectIsPendingTransportEvent } from '../reducers/suite/deviceReducer';
import * as suiteActions from '../actions/suite/suiteActions';
import { isWeb } from '@suite-utils/env';
import { resolveStaticPath } from '@trezor/utils';

const connectSrc = resolveStaticPath('connect/');
// 'https://localhost:8088/';
// 'https://connect.corp.sldev.cz/develop/';

const connectInitSettings = {
    connectSrc,
    transportReconnect: true,
    debug: false,
    popup: false,
    webusb: isWeb(),
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};

export const extraDependencies: ExtraDependencies = {
    thunks: {
        notificationsAddEvent: addEvent,
    },
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => (state: AppState) =>
            state.wallet.fees[networkSymbol],
        selectDevices: (state: AppState) => state.devices,
        selectBitcoinAmountUnit: (state: AppState) => state.wallet.settings.bitcoinAmountUnit,
        selectEnabledNetworks: (state: AppState) => state.wallet.settings.enabledNetworks,
        selectAccountTransactions: (state: AppState) => state.wallet.transactions.transactions,
        selectIsPendingTransportEvent,
    },
    actions: {
        setAccountLoadedMetadata: metadataActions.setAccountLoaded,
        setAccountAddMetadata: metadataActions.setAccountAdd,
        fiatRateUpdate: fiatRatesActions.updateFiatRates,
        lockDevice: suiteActions.lockDevice,
    },
    actionTypes: {
        storageLoad: STORAGE.LOAD,
    },
    reducers: {
        // @TODO - use BlockchainState from @suite-common/wallet-blockchain after redux-utils will be merged
        storageLoadBlockchain: (state: BlockchainState, { payload }: StorageLoadAction) => {
            payload.backendSettings.forEach(backend => {
                state[backend.key].backends = backend.value;
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
        storageLoadAccounts: (_, { payload }: StorageLoadAction) => payload.accounts,
    },
    utils: {
        saveAs: (data, fileName) => saveAs(data, fileName),
        connectInitSettings,
    },
};
