import { SubscriptionAccountInfo, BlockchainSettings } from './common';
import {
    AccountBalanceHistoryParams,
    GetCurrentFiatRatesParams,
    GetFiatRatesForTimestampsParams,
    GetFiatRatesTickersListParams,
    EstimateFeeParams,
    AccountInfoParams,
} from './params';
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
    payload: GetFiatRatesTickersListParams;
}

export interface GetAccountBalanceHistory {
    type: typeof MESSAGES.GET_ACCOUNT_BALANCE_HISTORY;
    payload: AccountBalanceHistoryParams;
}

export interface GetCurrentFiatRates {
    type: typeof MESSAGES.GET_CURRENT_FIAT_RATES;
    payload: GetCurrentFiatRatesParams;
}

export interface GetFiatRatesForTimestamps {
    type: typeof MESSAGES.GET_FIAT_RATES_FOR_TIMESTAMPS;
    payload: GetFiatRatesForTimestampsParams;
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
