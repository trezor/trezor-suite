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

/**
 * Narrows method+payload pair to a specific method `K`. TypeScript can't infer
 * that `payload` matches `CallMethodParams<K>` from a generic `M extends CallMethodKeys`
 * just by checking `method === K`, so we encode the relationship in a type guard.
 *
 * The `payload` parameter is typed as `unknown` to avoid an intersection between
 * `CallMethodParams<M>` and `CallMethodParams<K>` (which would collapse to `never`
 * for distinct methods); after the predicate we narrow it directly to `K`'s shape.
 */
export const isCallMethod = <K extends CallMethodKeys>(
    method: CallMethodKeys,
    targetMethod: K,
    _payload: unknown,
): _payload is Omit<CallMethodParams<K>, 'method'> => method === targetMethod;
