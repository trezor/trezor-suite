/* @flow */

export type Deferred<T> = {
    id: number,
    promise: Promise<T>,
    resolve: (t: T) => void,
    reject: (e: Error) => void,
};

export { Message } from './messages';
export { Response } from './responses';

export type BlockchainSettings = {
    name: string,
    worker: string,
    server: Array<string>,
    debug?: boolean,
}

type Blockchain = {

    +getInfo: () => Promise<{
        name: string,
        id: string,
        currentBlock: number,
    }>;

    +getAccountInfo: (params: {
        descriptor: string,
        mempool?: boolean, 
        history?: boolean,
    }) => Promise<{
        addresses: Array<string>;
        balance: number;
        availableBalance: number;
    }>;

    +getFee: () => Promise<string>;

    subscribe: (params: {
        type: 'block',
    } | {
        type: 'address',
        addresses: Array<string>,
    }) => Promise<boolean>;

    unsubscribe: (params: {
        type: 'block',
    } | {
        type: 'address',
        addresses: Array<string>,
    }) => Promise<boolean>;

    pushTransaction: (tx: string) => Promise<string>;
}

export type Blockbook = {
    getInfo: $ElementType<Blockchain, 'getInfo'>;
    getAccountInfo: $ElementType<Blockchain, 'getAccountInfo'>;
    getFee: $ElementType<Blockchain, 'getFee'>;
    subscribe: $ElementType<Blockchain, 'subscribe'>;
    unsubscribe: $ElementType<Blockchain, 'unsubscribe'>;
    pushTransaction: $ElementType<Blockchain, 'pushTransaction'>;
}

export type Ripple = {
    getInfo: $ElementType<Blockchain, 'getInfo'>;
    // getAccountInfo: (params: string) => Promise<boolean>; // custom method
    getAccountInfo: $ElementType<Blockchain, 'getAccountInfo'>;
    getFee: $ElementType<Blockchain, 'getFee'>;
    subscribe: $ElementType<Blockchain, 'subscribe'>;
    unsubscribe: $ElementType<Blockchain, 'unsubscribe'>;
    pushTransaction: $ElementType<Blockchain, 'pushTransaction'>;
}


// /* eslint-disable no-redeclare */
// export type Init = (params: BlockchainInstance | Array<BlockchainInstance>) => void;
// export type GetInfo = (params: Network) => Promise<ResponseTypes.GetInfo>;
// declare function F_GetAccountInfo(params: { network: 'blockbook' } & MessageTypes.BlockbookAccountInfo): Promise<ResponseTypes.GetAccountInfo>;
// declare function F_GetAccountInfo(params: { network: 'ripple' } & MessageTypes.RippleAccountInfo): Promise<ResponseTypes.GetAccountInfo>;
// export type GetAccountInfo = typeof F_GetAccountInfo;
// export type Subscribe = (params: Network & $ElementType<MessageTypes.Subscribe, 'payload'>) => Promise<ResponseTypes.Subscribe>;
// export type Unsubscribe = (params: Network & $ElementType<MessageTypes.Unsubscribe, 'payload'>) => Promise<ResponseTypes.Unsubscribe>;
// export type PushTransaction = (params: Network & $ElementType<MessageTypes.PushTransaction, 'payload'>) => Promise<ResponseTypes.PushTransaction>;
// /* eslint-disable no-redeclare */


