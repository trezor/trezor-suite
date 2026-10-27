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

export type ConnectPopupMethodKey = CallMethodKeys;

export type MethodPayload<M extends ConnectPopupMethodKey> = DistributiveOmit<
    CallMethodParams<M>,
    'method'
>;

export type CompatibilityParams<M extends ConnectPopupMethodKey> = {
    method: M;
    payload: MethodPayload<M>;
    source: ConnectCallSource;
};

// May redirect to another method; `source` is input-only.
export type CompatibilityResult = Pick<
    CompatibilityParams<ConnectPopupMethodKey>,
    'method' | 'payload'
>;

export type ValidateParams<M extends ConnectPopupMethodKey> = CompatibilityParams<M>;

export type PreCallParams<M extends ConnectPopupMethodKey> = {
    method: M;
    payload: MethodPayload<M>;
    dispatch: Dispatch;
    getState: () => any;
    txSigningPrecomposed?: PrecomposedTransactionFinal;
    source: ConnectCallSource;
};

export type PostCallParams<M extends ConnectPopupMethodKey> = PreCallParams<M> & {
    originalPayload: MethodPayload<M>;
    response: Ok<CallMethodResponse<M>> | Err<SerializedError>;
};

/**
 * Popup-specific behavior of a Connect method. Every step is optional; the call thunk owns the
 * generic flow (permissions, device, analytics, errors) around them.
 */
export type ConnectPopupMethodDefinition<M extends ConnectPopupMethodKey> = {
    /** Rewrites the call before anything else, mostly to keep older apps working. */
    compatibility?: (params: CompatibilityParams<M>) => CompatibilityResult | undefined;
    /** Rejects a call the host cannot fulfil before the permissions are requested. */
    validate?: (params: ValidateParams<M>) => void;
    /** Prepares the popup UI; may return a modified payload for the device call. */
    preCall?: (
        params: PreCallParams<M>,
    ) => Promise<MethodPayload<M> | undefined> | MethodPayload<M> | undefined;
    /** Resolves to `true` to keep the call open after the device call returns. */
    postCall?: (params: PostCallParams<M>) => Promise<boolean> | boolean;
};

export type ConnectPopupMethodRegistry = {
    [M in ConnectPopupMethodKey]?: ConnectPopupMethodDefinition<M>;
};
