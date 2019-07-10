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
}

export interface GetAccountInfo {
    type: typeof MESSAGES.GET_ACCOUNT_INFO;
    payload: {
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
    };
}

export interface GetAccountUtxo {
    type: typeof MESSAGES.GET_ACCOUNT_UTXO;
    payload: {
        descriptor: string; // address or xpub
    };
}

export interface GetTransaction {
    type: typeof MESSAGES.GET_TRANSACTION;
    payload: string;
}

export interface EstimateFeeOptions {
    transaction?: any; // custom object, used in ethereum
    levels?: {
        name: string;
        value: string;
    }[];
}
export interface EstimateFee {
    type: typeof MESSAGES.ESTIMATE_FEE;
    payload?: EstimateFeeOptions;
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
    | ({ id: number } & GetAccountInfo)
    | ({ id: number } & GetAccountUtxo)
    | ({ id: number } & GetTransaction)
    | ({ id: number } & EstimateFee)
    | ({ id: number } & Subscribe)
    | ({ id: number } & Unsubscribe)
    | ({ id: number } & PushTransaction);
