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
    worker: string | Function,
    server: Array<string>,
    debug?: boolean,
};

export type BlockchainInfo = {
    name: string,
    id: string,
    currentBlock: number,
};

export type AccountInfo = {
    addresses: Array<string>,
    balance: string,
    availableBalance: string,
};
