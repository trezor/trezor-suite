/* @flow */

import { HANDSHAKE } from '../constants/messages';
import * as RESPONSES from '../constants/responses';

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

export type AccountAddresses = {
    change: Array<Address>,
    used: Array<Address>,
    unused: Array<Address>,
};

export type TokenInfo = {
    type: string, // token type: ERC20...
    address: string, // token address
    balance: string, // token balance
    name: string, // token name
    symbol: string, // token symbol
    decimals: number, //
    // transfers: number, // total transactions?
};

export type AccountInfo = {
    descriptor: string,
    balance: string,
    availableBalance: string,
    tokens?: Array<TokenInfo>, // ethereum tokens
    addresses?: AccountAddresses, // bitcoin addresses
    history: {
        total: number, // total transactions (unknown in ripple)
        tokens?: number, // tokens transactions
        unconfirmed: number, // unconfirmed transactions
        transactions?: Array<Transaction>, // list of transactions
        txids?: Array<string>, // not implemented
    },
    misc: {
        // ETH
        nonce?: string,
        // XRP
        sequence?: number,
        reserve?: string,
    },
    page?: ?{
        // blockbook
        index: number,
        size: number,
        total: number,
    },
    marker?: ?{
        // ripple-lib
        ledger: number,
        seq: number,
    },
};

export type GetAccountInfo = {
    type: typeof RESPONSES.GET_ACCOUNT_INFO,
    payload: AccountInfo,
};

export type GetAccountUtxo = {
    type: typeof RESPONSES.GET_ACCOUNT_UTXO,
    payload: any,
};

export type GetTransaction = {
    type: typeof RESPONSES.GET_TRANSACTION,
    payload: any,
};

export type EstimateFee = {
    type: typeof RESPONSES.ESTIMATE_FEE,
    payload: Array<{ name: string, value: string }>,
};

export type Subscribe = {
    type: typeof RESPONSES.SUBSCRIBE,
    payload: boolean,
};

export type BlockEvent = {
    type: 'block',
    payload: {
        block: string,
        hash: string,
    },
};

export type Address = {
    address: string,
    path: string,
    transfers: number,
    decimal: number,
    balance?: string,
    sent?: string,
    received?: string,
};

export type Input = {
    n: number,
    addresses?: Array<string>,
    coinbase?: string,
    isAddress: boolean,
};

export type Output = {
    n: number,
    value: string,
    addresses?: Array<string>,
    isAddress: boolean,
};

export type TokenTransfer = {
    type: 'sent' | 'recv' | 'self',
    name: string,
    symbol: string,
    address: string,
    decimals: number,
    amount: string,
    from?: string,
    to?: string,
};

export type Transaction1 = {
    type: 'sent' | 'recv' | 'self' | 'unknown',
    descriptor: string, // account descriptor

    txid: string,
    blockTime: ?number,
    blockHeight: ?number,
    blockHash: ?string,
    inputs: Array<Input>,
    outputs: Array<Output>,
    value: string,
    fees: string,
    total: string, // value + total

    tokenTransfers?: Array<TokenTransfer>, // ETH token transfers

    ethereumSpecific?: {
        status: number,
        nonce: number,
        gasLimit: number,
        gasUsed: number,
        gasPrice: string,
    },
    rippleSpecific?: {
        sequence: number,
    },

    // tokens?: Array<Token>,
    // sequence?: number, // eth: nonce || ripple: sequence
};

export type Transaction = {
    type: 'sent' | 'recv' | 'self' | 'unknown',

    txid: string,
    blockTime: ?number,
    blockHeight: ?number,
    blockHash: ?string,

    amount: string,
    fee: string,
    // total: string, // amount + total

    targets: Array<Input | Output>,
    tokens: Array<TokenTransfer>,
};

export type NotificationEvent = {
    type: 'notification',
    payload: Transaction,
};

export type Notification = {
    type: typeof RESPONSES.NOTIFICATION,
    payload: BlockEvent | NotificationEvent,
};

export type Unsubscribe = {
    type: typeof RESPONSES.UNSUBSCRIBE,
    payload: boolean,
};

export type PushTransaction = {
    type: typeof RESPONSES.PUSH_TRANSACTION,
    // payload: RIPPLE.PushTransaction$ | BLOCKBOOK.PushTransaction$;
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
    | ({ id: number } & EstimateFee)
    | ({ id: number } & Subscribe)
    | ({ id: number } & Unsubscribe)
    | ({ id: number } & Notification)
    | ({ id: number } & PushTransaction);
