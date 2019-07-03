import { HANDSHAKE } from '../constants/messages';
import * as RESPONSES from '../constants/responses';
import { AccountInfo, Transaction } from './common';

// messages sent from worker to blockchain.js

export type Connect = {
    type: typeof RESPONSES.CONNECT,
    payload: boolean,
};

export type Error = {
    type: typeof RESPONSES.ERROR,
    payload: {
        code: string,
        message: string,
    },
};

export type GetInfo = {
    type: typeof RESPONSES.GET_INFO,
    payload: {
        name: string,
        shortcut: string,
        testnet: boolean,
        version: string,
        decimals: number,
        blockHeight: number,
        blockHash: string,
        misc?: {
            reserve?: string,
        },
    },
};

export type GetBlockHash = {
    type: typeof RESPONSES.GET_BLOCK_HASH,
    payload: any,
};

export type GetAccountInfo = {
    type: typeof RESPONSES.GET_ACCOUNT_INFO,
    payload: AccountInfo,
};

export type Utxo = {
    txid: string,
    vout: number,
    amount: string,
    blockHeight: number,
    address: string,
    path: string,
    confirmations: number,
};

export type GetAccountUtxo = {
    type: typeof RESPONSES.GET_ACCOUNT_UTXO,
    payload: Utxo[],
};

export type GetTransaction = {
    type: typeof RESPONSES.GET_TRANSACTION,
    payload: any,
};

export type EstimateFee = {
    type: typeof RESPONSES.ESTIMATE_FEE,
    payload: {
        feePerUnit: string,
        feePerTx?: string,
        feeLimit?: string,
    }[],
};

export type Subscribe = {
    type: typeof RESPONSES.SUBSCRIBE,
    payload: { subscribed: boolean },
};

export type Unsubscribe = {
    type: typeof RESPONSES.UNSUBSCRIBE,
    payload: { subscribed: boolean },
};

export type BlockEvent = {
    type: 'block',
    payload: {
        blockHeight: number,
        blockHash: string,
    },
};

export type NotificationEvent = {
    type: 'notification',
    payload: {
        descriptor: string,
        tx: Transaction,
    },
};

export type Notification = {
    type: typeof RESPONSES.NOTIFICATION,
    payload: BlockEvent | NotificationEvent,
};

export type PushTransaction = {
    type: typeof RESPONSES.PUSH_TRANSACTION,
    payload: any,
};

type WithoutPayload = {
    id: number,
    type: typeof HANDSHAKE | typeof RESPONSES.CONNECTED,
    payload?: any, // just for flow
};

// extended
export type Response =
    | WithoutPayload
    | { id: number, type: typeof RESPONSES.DISCONNECTED, payload: boolean }
    | ({ id: number } & Error)
    | ({ id: number } & Connect)
    | ({ id: number } & GetInfo)
    | ({ id: number } & GetAccountInfo)
    | ({ id: number } & GetAccountUtxo)
    | ({ id: number } & GetTransaction)
    | ({ id: number } & EstimateFee)
    | ({ id: number } & Subscribe)
    | ({ id: number } & Unsubscribe)
    | ({ id: number } & Notification)
    | ({ id: number } & PushTransaction);
