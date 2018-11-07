/* @flow */

import { HANDSHAKE } from '../constants/messages';
import * as RESPONSES from '../constants/responses';

// messages sent from worker to blockchain.js

export type Error = {
    +type: typeof RESPONSES.ERROR,
    +error: string,
}

export type GetInfo = {
    +type: typeof RESPONSES.GET_INFO,
    // +payload: RIPPLE.GetInfo$ | BLOCKBOOK.GetInfo$,
    +payload: any,
}

export type GetAccountInfo = {
    +type: typeof RESPONSES.GET_ACCOUNT_INFO;
    // +payload: RIPPLE.GetAccountInfo$;
    +payload: any,
};

export type Subscribe = {
    +type: typeof RESPONSES.SUBSCRIBE,
    +payload: boolean,
};

export type Notification = {
    +type: typeof RESPONSES.NOTIFICATION,
    +payload: {
        type: 'block',
        data: {
            block: string,
            hash: string,
        },
    } | {
        type: 'address',
        data: any,
    }
};

export type Unsubscribe = {
    +type: typeof RESPONSES.UNSUBSCRIBE,
    +payload: boolean,
}

export type PushTransaction = {
    +type: typeof RESPONSES.PUSH_TRANSACTION;
    // +payload: RIPPLE.PushTransaction$ | BLOCKBOOK.PushTransaction$;
    +payload: any;
}

// extended
export type Response = 
    { id: number, +type: typeof HANDSHAKE } |
    { id: number } & Error |
    { id: number } & GetInfo |
    { id: number } & GetAccountInfo |
    { id: number } & Subscribe |
    { id: number } & Unsubscribe |
    { id: number } & Notification |
    { id: number } & PushTransaction;
