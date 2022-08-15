import { ExtraDependencies } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { STORAGE } from '../actions/suite/constants';
import { addEvent } from '../actions/suite/notificationActions';
import { StorageLoadAction } from '../actions/suite/storageActions';
import { fetchAndUpdateAccount } from '../actions/wallet/accountActions';
import type { BlockchainState } from '../reducers/wallet/blockchainReducer';
import { AppState } from '../types/suite';

export const extraDependencies: ExtraDependencies = {
    thunks: { fetchAndUpdateAccount, notificationsAddEvent: addEvent },
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => (state: AppState) =>
            state.wallet.fees[networkSymbol],
        selectAccounts: (state: AppState) => state.wallet.accounts,
        selectDevices: (state: AppState) => state.devices,
        selectBitcoinAmountUnit: (state: AppState) => state.wallet.settings.bitcoinAmountUnit,
    },
    actions: {},
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
    },
};
