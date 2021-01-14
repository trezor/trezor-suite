import { SubscriptionAccountInfo, BlockchainSettings } from './common';
import * as MESSAGES from '../constants/messages';

// messages sent from blockchain.js to worker

export interface Connect {
    type: typeof MESSAGES.CONNECT;
}
export interface Disconnect {
    type: typeof MESSAGES.DISCONNECT;
}

export interface GetInfo {
    type: typeof MESSAGES.GET_INFO;
}

export interface GetBlockHash {
    type: typeof MESSAGES.GET_BLOCK_HASH;
    payload: number;
}

export interface AccountInfoParams {
    descriptor: string; // address or xpub
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs'; // depth, default: 'basic'
    tokens?: 'nonzero' | 'used' | 'derived'; // blockbook only, default: 'derived' - show all derived addresses, 'used' - show only used addresses, 'nonzero' - show only address with balance
    page?: number; // blockbook only, page index
    pageSize?: number; // how many transactions on page
    from?: number; // from block
    to?: number; // to block
    contractFilter?: string; // blockbook only, ethereum token filter
    gap?: number; // blockbook only, derived addresses gap
    // since ripple-lib cannot use pages "marker" is used as first unknown point in history (block and sequence of transaction)
    marker?: {
        ledger: number;
        seq: number;
    };
}

export interface GetAccountInfo {
    type: typeof MESSAGES.GET_ACCOUNT_INFO;
    payload: AccountInfoParams;
}

export interface GetAccountUtxo {
    type: typeof MESSAGES.GET_ACCOUNT_UTXO;
    payload: string; // address or xpub
}

export interface GetTransaction {
    type: typeof MESSAGES.GET_TRANSACTION;
    payload: string;
}

export interface GetFiatRatesTickersList {
    type: typeof MESSAGES.GET_FIAT_RATES_TICKERS_LIST;
    payload: {
        timestamp?: number;
    };
}

export interface AccountBalanceHistoryParams {
    descriptor: string;
    from: number;
    to: number;
    currencies?: string[];
    groupBy?: number;
}

export interface GetAccountBalanceHistory {
    type: typeof MESSAGES.GET_ACCOUNT_BALANCE_HISTORY;
    payload: AccountBalanceHistoryParams;
}

export interface GetCurrentFiatRates {
    type: typeof MESSAGES.GET_CURRENT_FIAT_RATES;
    payload: {
        currencies?: string[];
    };
}

export interface GetFiatRatesForTimestamps {
    type: typeof MESSAGES.GET_FIAT_RATES_FOR_TIMESTAMPS;
    payload: {
        timestamps: number[];
        currencies?: string[];
    };
}

export interface EstimateFeeParams {
    blocks?: number[];
    specific?: {
        conservative?: boolean; // btc
        txsize?: number; // btc transaction size
        from?: string; // eth from
        to?: string; // eth to
        data?: string; // eth tx data
        value?: string; // eth tx amount
    };
}

export interface EstimateFee {
    type: typeof MESSAGES.ESTIMATE_FEE;
    payload: EstimateFeeParams;
}

export interface Subscribe {
    type: typeof MESSAGES.SUBSCRIBE;
    payload:
        | {
              type: 'block';
          }
        | {
              type: 'addresses';
              addresses: string[];
          }
        | {
              type: 'accounts';
              accounts: SubscriptionAccountInfo[];
          }
        | {
              type: 'fiatRates';
              currency?: string;
          };
}

export interface Unsubscribe {
    type: typeof MESSAGES.UNSUBSCRIBE;
    payload:
        | {
              type: 'block';
          }
        | {
              type: 'addresses';
              addresses?: string[];
          }
        | {
              type: 'accounts';
              accounts?: SubscriptionAccountInfo[];
          }
        | {
              type: 'fiatRates';
          };
}

export interface PushTransaction {
    type: typeof MESSAGES.PUSH_TRANSACTION;
    payload: string;
}

export type Message =
    | { id: number; type: typeof MESSAGES.HANDSHAKE; settings: BlockchainSettings }
    | ({ id: number } & Connect)
    | ({ id: number } & Disconnect)
    | ({ id: number } & GetInfo)
    | ({ id: number } & GetBlockHash)
    | ({ id: number } & GetAccountInfo)
    | ({ id: number } & GetAccountUtxo)
    | ({ id: number } & GetTransaction)
    | ({ id: number } & GetCurrentFiatRates)
    | ({ id: number } & GetFiatRatesForTimestamps)
    | ({ id: number } & GetAccountBalanceHistory)
    | ({ id: number } & GetFiatRatesTickersList)
    | ({ id: number } & EstimateFee)
    | ({ id: number } & Subscribe)
    | ({ id: number } & Unsubscribe)
    | ({ id: number } & PushTransaction);
