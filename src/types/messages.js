/* @flow */

import * as MESSAGES from '../constants/messages';
import type { BlockchainSettings } from './index';

// messages sent from blockchain.js to worker

export type GetInfo = {
    +type: typeof MESSAGES.GET_INFO,
};

export type GetAccountInfo = {
    +type: typeof MESSAGES.GET_ACCOUNT_INFO,
    +payload: {
        +descriptor: string,
    },
};

// GetAccountInfo custom payload
export type BlockbookAccountInfo = {
    network: 'blockbook',
    xpub: string,
}

export type RippleAccountInfo = {
    network: 'ripple',
    address: string,
}

export type Subscribe = {
    +type: typeof MESSAGES.SUBSCRIBE,
    +payload: {
        type: 'block',
    } | {
        type: 'address',
        addresses: Array<string>,
        mempool?: boolean,
    };
}

export type Unsubscribe = {
    +type: typeof MESSAGES.UNSUBSCRIBE,
    +payload: {
        type: 'block',
    } | {
        type: 'address',
        addresses: Array<string>,
    };
}

export type PushTransaction = {
    +type: typeof MESSAGES.PUSH_TRANSACTION,
    +payload: string;
}

export type Message =
    { id: number, +type: typeof MESSAGES.HANDSHAKE, settings: BlockchainSettings } |
    { id: number } & GetInfo |
    { id: number } & GetAccountInfo |
    { id: number } & Subscribe |
    { id: number } & PushTransaction;