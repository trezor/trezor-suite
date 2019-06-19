/* @flow */

import type { BlockchainSettings } from './index';
import * as MESSAGES from '../constants/messages';

// messages sent from blockchain.js to worker

export type Connect = {
    type: typeof MESSAGES.CONNECT,
};

export type GetInfo = {
    type: typeof MESSAGES.GET_INFO,
};

export type GetBlockHash = {
    type: typeof MESSAGES.GET_BLOCK_HASH,
};

export type GetAccountInfo = {
    type: typeof MESSAGES.GET_ACCOUNT_INFO,
    payload: {
        descriptor: string, // address or xpub
        details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs', // depth, default: 'basic'
        tokens?: 'nonzero' | 'used' | 'derived', // blockbook only, default: 'derived' - show all derived addresses, 'used' - show only used addresses, 'nonzero' - show only address with balance
        page?: number, // blockbook only, page index
        pageSize?: number, // how many transactions on page
        from?: number, // from block
        to?: number, // to block
        contractFilter?: string, // blockbook only, ethereum token filter
        // since ripple-lib cannot use pages "marker" is used as first unknown point in history (block and sequence of transaction)
        marker?: {
            ledger: number,
            seq: number,
        },
    },
};

export type GetAccountUtxo = {
    type: typeof MESSAGES.GET_ACCOUNT_INFO,
    payload: {
        descriptor: string, // address or xpub
    },
};

export type EstimateFeeOptions = {
    transaction?: any, // custom object, used in ethereum
    levels?: Array<{
        name: string,
        value: string,
    }>,
};
export type EstimateFee = {
    type: typeof MESSAGES.ESTIMATE_FEE,
    payload?: EstimateFeeOptions,
};

export type Subscribe = {
    type: typeof MESSAGES.SUBSCRIBE,
    payload:
        | {
              type: 'block',
          }
        | {
              type: 'notification',
              addresses: Array<string>,
              mempool?: boolean,
          },
};

export type Unsubscribe = {
    type: typeof MESSAGES.UNSUBSCRIBE,
    payload:
        | {
              type: 'block',
          }
        | {
              type: 'notification',
              addresses: Array<string>,
          },
};

export type PushTransaction = {
    type: typeof MESSAGES.PUSH_TRANSACTION,
    payload: string,
};

export type Message =
    | { id: number, type: typeof MESSAGES.HANDSHAKE, settings: BlockchainSettings }
    | ({ id: number } & Connect)
    | ({ id: number } & GetInfo)
    | ({ id: number } & GetAccountInfo)
    | ({ id: number } & EstimateFee)
    | ({ id: number } & Subscribe)
    | ({ id: number } & PushTransaction);
