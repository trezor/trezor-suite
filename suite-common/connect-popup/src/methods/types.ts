import { type Dispatch } from '@reduxjs/toolkit/react';

import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    type CallMethodKeys,
    type CallMethodParams,
    type CallMethodResponse,
} from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Err, type Ok } from '@trezor/type-utils';

import { type ConnectCallSource } from '../connectPopupTypes';

export type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;

export type CompatibilityHookParams<M extends CallMethodKeys> = {
    method: M;
    payload: DistributiveOmit<CallMethodParams<M>, 'method'>;
    source: ConnectCallSource;
};

// A compatibility hook only rewrites the method/payload; `source` is input-only.
export type CompatibilityHookResult<M extends CallMethodKeys> = Pick<
    CompatibilityHookParams<M>,
    'method' | 'payload'
>;

export type PreCallHookParams<M extends CallMethodKeys> = {
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
    dispatch: Dispatch;
    getState: () => any;
    txSigningPrecomposed?: PrecomposedTransactionFinal;
    source: ConnectCallSource;
};
export type PostCallHookParams<M extends CallMethodKeys> = PreCallHookParams<M> & {
    originalPayload: Omit<CallMethodParams<M>, 'method'>;
    response: Ok<CallMethodResponse<M>> | Err<SerializedError>;
};
