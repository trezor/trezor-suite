/* @flow */

export type Deferred<T> = {
    id: number,
    promise: Promise<T>,
    resolve: (t: T) => void,
    reject: (e: Error) => void,
};

export { Message } from './messages';
export { Response } from './responses';

import * as MessageTypes from './messages';
import * as ResponseTypes from './responses';

type Network = {
    network?: string;
}

/* eslint-disable no-redeclare */
export type GetInfo = (params: Network) => Promise<ResponseTypes.GetInfo>;
declare function F_GetAccountInfo(params: { network: 'blockbook' } & MessageTypes.BlockbookAccountInfo): Promise<ResponseTypes.GetAccountInfo>;
declare function F_GetAccountInfo(params: { network: 'ripple' } & MessageTypes.RippleAccountInfo): Promise<ResponseTypes.GetAccountInfo>;
export type GetAccountInfo = typeof F_GetAccountInfo;
export type Subscribe = (params: Network & $ElementType<MessageTypes.Subscribe, 'payload'>) => Promise<ResponseTypes.Subscribe>;
export type Unsubscribe = (params: Network & $ElementType<MessageTypes.Unsubscribe, 'payload'>) => Promise<ResponseTypes.Unsubscribe>;
export type PushTransaction = (params: Network & $ElementType<MessageTypes.PushTransaction, 'payload'>) => Promise<ResponseTypes.PushTransaction>;
/* eslint-disable no-redeclare */

