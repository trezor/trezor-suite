import { FiatRates, AccountBalanceHistory } from './blockbook';
import { HANDSHAKE } from '../constants/messages';
import * as RESPONSES from '../constants/responses';
import { AccountInfo, Transaction, TypedRawTransaction } from './common';

// messages sent from worker to blockchain.js

export interface Connect {
    type: typeof RESPONSES.CONNECT;
    payload: boolean;
}

export interface Error {
    type: typeof RESPONSES.ERROR;
    payload: {
        code: string;
        message: string;
    };
}

export interface GetInfo {
    type: typeof RESPONSES.GET_INFO;
    payload: {
        url: string;
        name: string;
        shortcut: string;
        testnet: boolean;
        version: string;
        decimals: number;
        blockHeight: number;
        blockHash: string;
    };
}

export interface GetBlockHash {
    type: typeof RESPONSES.GET_BLOCK_HASH;
    payload: string;
}

export interface GetAccountInfo {
    type: typeof RESPONSES.GET_ACCOUNT_INFO;
    payload: AccountInfo;
}

export interface Utxo {
    txid: string;
    vout: number;
    amount: string;
    blockHeight: number;
    address: string;
    path: string;
    confirmations: number;
    coinbase?: boolean;
}

export interface GetAccountUtxo {
    type: typeof RESPONSES.GET_ACCOUNT_UTXO;
    payload: Utxo[];
}

export interface GetTransaction {
    type: typeof RESPONSES.GET_TRANSACTION;
    payload: TypedRawTransaction;
}

export interface GetAccountBalanceHistory {
    type: typeof RESPONSES.GET_ACCOUNT_BALANCE_HISTORY;
    payload: AccountBalanceHistory[];
}

export interface GetCurrentFiatRates {
    type: typeof RESPONSES.GET_CURRENT_FIAT_RATES;
    payload: {
        ts: number;
        rates: FiatRates;
    };
}

export interface GetFiatRatesForTimestamps {
    type: typeof RESPONSES.GET_FIAT_RATES_FOR_TIMESTAMPS;
    payload: {
        tickers: {
            ts: number;
            rates: FiatRates;
        }[];
    };
}

export interface GetFiatRatesTickersList {
    type: typeof RESPONSES.GET_FIAT_RATES_TICKERS_LIST;
    payload: {
        ts: number;
        availableCurrencies: string[];
    };
}

export interface EstimateFee {
    type: typeof RESPONSES.ESTIMATE_FEE;
    payload: {
        feePerUnit: string;
        feePerTx?: string;
        feeLimit?: string;
    }[];
}

export interface Subscribe {
    type: typeof RESPONSES.SUBSCRIBE;
    payload: { subscribed: boolean };
}

export interface Unsubscribe {
    type: typeof RESPONSES.UNSUBSCRIBE;
    payload: { subscribed: boolean };
}

export interface BlockEvent {
    type: 'block';
    payload: {
        blockHeight: number;
        blockHash: string;
    };
}

export interface NotificationEvent {
    type: 'notification';
    payload: {
        descriptor: string;
        tx: Transaction;
    };
}

export interface FiatRatesEvent {
    type: 'fiatRates';
    payload: {
        rates: FiatRates;
    };
}

export interface Notification {
    type: typeof RESPONSES.NOTIFICATION;
    payload: BlockEvent | NotificationEvent | FiatRatesEvent;
}

export interface PushTransaction {
    type: typeof RESPONSES.PUSH_TRANSACTION;
    payload: string;
}

interface WithoutPayload {
    id: number;
    type: typeof HANDSHAKE | typeof RESPONSES.CONNECTED;
    payload?: any; // just for flow
}

// extended
export type Response =
    | WithoutPayload
    | { id: number; type: typeof RESPONSES.DISCONNECTED; payload: boolean }
    | ({ id: number } & Error)
    | ({ id: number } & Connect)
    | ({ id: number } & GetInfo)
    | ({ id: number } & GetBlockHash)
    | ({ id: number } & GetAccountInfo)
    | ({ id: number } & GetAccountUtxo)
    | ({ id: number } & GetTransaction)
    | ({ id: number } & GetAccountBalanceHistory)
    | ({ id: number } & GetCurrentFiatRates)
    | ({ id: number } & GetFiatRatesForTimestamps)
    | ({ id: number } & GetFiatRatesTickersList)
    | ({ id: number } & EstimateFee)
    | ({ id: number } & Subscribe)
    | ({ id: number } & Unsubscribe)
    | ({ id: number } & Notification)
    | ({ id: number } & PushTransaction);
