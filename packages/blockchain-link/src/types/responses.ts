import { FormattedTransactionType as RippleTransaction } from 'ripple-lib';
import { Transaction as BlockbookTransaction } from './blockbook';
import { Transaction as BitcoindTransaction } from './rpcbitcoind';
import { HANDSHAKE } from '../constants/messages';
import * as RESPONSES from '../constants/responses';
import { AccountInfo, Transaction } from './common';

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
    payload:
        | {
              type: 'ripple';
              tx: RippleTransaction;
          }
        | {
              type: 'blockbook';
              tx: BlockbookTransaction;
          }
        | {
              type: 'bitcoind';
              tx: BitcoindTransaction;
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

export interface Notification {
    type: typeof RESPONSES.NOTIFICATION;
    payload: BlockEvent | NotificationEvent;
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
    | ({ id: number } & EstimateFee)
    | ({ id: number } & Subscribe)
    | ({ id: number } & Unsubscribe)
    | ({ id: number } & Notification)
    | ({ id: number } & PushTransaction);
