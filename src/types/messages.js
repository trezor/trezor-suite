/* @flow */

import * as MESSAGES from '../constants/messages';
import type { BlockchainSettings } from './index';

// messages sent from blockchain.js to worker

export type Connect = {
    +type: typeof MESSAGES.CONNECT,
};

export type GetInfo = {
    +type: typeof MESSAGES.GET_INFO,
};

export type GetAccountInfoOptions = {
    +type?: string,
    +page?: number,
    +from?: number,
    +to?: number,
    +limit?: number,
};
export type GetAccountInfo = {
    +type: typeof MESSAGES.GET_ACCOUNT_INFO,
    +payload: {
        +descriptor: string,
        +options?: GetAccountInfoOptions,
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
    +type: typeof MESSAGES.ESTIMATE_FEE,
    +payload?: EstimateFeeOptions,
};

export type Subscribe = {
    +type: typeof MESSAGES.SUBSCRIBE,
    +payload: {
        type: 'block',
    } | {
        type: 'notification',
        addresses: Array<string>,
        mempool?: boolean,
    };
}

export type Unsubscribe = {
    +type: typeof MESSAGES.UNSUBSCRIBE,
    +payload: {
        type: 'block',
    } | {
        type: 'notification',
        addresses: Array<string>,
    };
}

export type PushTransaction = {
    +type: typeof MESSAGES.PUSH_TRANSACTION,
    +payload: string;
}

export type Message =
    { id: number, +type: typeof MESSAGES.HANDSHAKE, settings: BlockchainSettings } |
    { id: number } & Connect |
    { id: number } & GetInfo |
    { id: number } & GetAccountInfo |
    { id: number } & EstimateFee |
    { id: number } & Subscribe |
    { id: number } & PushTransaction;