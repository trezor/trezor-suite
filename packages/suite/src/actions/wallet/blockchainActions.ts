import {
    initThunk,
    onBlockMinedThunk,
    onConnectThunk,
    onDisconnectThunk,
    onNotificationThunk,
    preloadFeeInfoThunk,
    reconnectThunk,
    setCustomBackendThunk,
    subscribeThunk,
    syncAccountsThunk,
    unsubscribeThunk,
    updateFeeInfoThunk,
} from '@suite-common/wallet-blockchain';
import { State as FeeState } from '@wallet-reducers/feesReducer';

import { BLOCKCHAIN } from './constants';

import type { Network, CustomBackend, BackendType } from '@wallet-types';
import type { Timeout } from '@trezor/type-utils';
// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks

export type BlockchainAction =
    | {
          type: typeof BLOCKCHAIN.CONNECTED;
          payload: Network['symbol'];
      }
    | {
          type: typeof BLOCKCHAIN.RECONNECT_TIMEOUT_START;
          payload: {
              symbol: Network['symbol'];
              id: Timeout;
              time: number;
              count: number;
          };
      }
    | {
          type: typeof BLOCKCHAIN.UPDATE_FEE;
          payload: Partial<FeeState>;
      }
    | {
          type: typeof BLOCKCHAIN.SYNCED;
          payload: {
              symbol: Network['symbol'];
              timeout: Timeout;
          };
      }
    | {
          type: typeof BLOCKCHAIN.SET_BACKEND;
          payload:
              | CustomBackend
              | {
                    coin: Network['symbol'];
                    type: 'default';
                };
      };

export const preloadFeeInfo = preloadFeeInfoThunk;

export const updateFeeInfo = updateFeeInfoThunk;

export const reconnect = reconnectThunk;

export const setCustomBackend = setCustomBackendThunk;

export const resetBackend = (coin: Network['symbol']): BlockchainAction => ({
    type: BLOCKCHAIN.SET_BACKEND,
    payload: {
        coin,
        type: 'default',
    },
});

export const setBackend = (
    coin: Network['symbol'],
    type: BackendType,
    urls: string[],
): BlockchainAction => ({
    type: BLOCKCHAIN.SET_BACKEND,
    payload: {
        coin,
        type,
        urls,
    },
});

export const init = initThunk;

// called from WalletMiddleware after ACCOUNT.ADD/UPDATE action
// or after BLOCKCHAIN.CONNECT event (blockchainActions.onConnect)
export const subscribe = (symbol: Network['symbol'], fiatRates = false) =>
    subscribeThunk({ symbol, fiatRates });

// called from WalletMiddleware after ACCOUNT.REMOVE action
export const unsubscribe = unsubscribeThunk;

export const syncAccounts = syncAccountsThunk;

export const onConnect = onConnectThunk;

export const onBlockMined = onBlockMinedThunk;

export const onNotification = onNotificationThunk;

export const onDisconnect = onDisconnectThunk;
