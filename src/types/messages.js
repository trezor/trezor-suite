/* @flow */

import * as MESSAGES from '../constants/messages';

// messages sent from blockchain.js to worker

export type Init = {
    +type: typeof MESSAGES.INIT,
};

export type GetInfo = {
    +type: typeof MESSAGES.GET_INFO,
};

export type GetAccountInfo = {
    +type: typeof MESSAGES.GET_ACCOUNT_INFO,
    +payload: BlockbookAccountInfo | RippleAccountInfo,
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
        +addresses: Array<string>,
        notificationHandler: ?(event: any) => void,
    };
}

export type Unsubscribe = {
    +type: typeof MESSAGES.UNSUBSCRIBE,
    +payload: {
        +addresses: Array<string>,
        notificationHandler: ?(event: any) => void,
    };
}

export type PushTransaction = {
    +type: typeof MESSAGES.PUSH_TRANSACTION,
    +payload: {
        +tx: string;
    },
}

export type Message =
    { id: number } & Init |
    { id: number } & GetInfo |
    { id: number } & GetAccountInfo |
    { id: number } & Subscribe |
    { id: number } & PushTransaction;