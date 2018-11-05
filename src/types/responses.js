/* @flow */

import * as RESPONSES from '../constants/responses';

// messages sent from worker to blockchain.js

export type Init = {
    +type: typeof RESPONSES.INIT,
}

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
    +payload: any;
};

export type PushTransaction = {
    +type: typeof RESPONSES.PUSH_TRANSACTION;
    // +payload: RIPPLE.PushTransaction$ | BLOCKBOOK.PushTransaction$;
    +payload: any;
}

export type Subscribe = {
    +type: typeof RESPONSES.SUBSCRIBE,
    +info: any,
};

export type Unsubscribe = {
    +type: typeof RESPONSES.UNSUBSCRIBE,
    +payload: {
        +addresses: Array<string>,
        notificationHandler: ?(event: any) => void,
    };
}

export type Notification = {
    +type: typeof RESPONSES.NOTIFICATION,
    +event: any,
};

// extended
export type Response = 
    { id: number } & Init |
    { id: number } & Error |
    { id: number } & GetInfo |
    { id: number } & GetAccountInfo |
    { id: number } & Subscribe |
    { id: number } & Notification |
    { id: number } & PushTransaction;
