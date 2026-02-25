import { Dispatch } from '@reduxjs/toolkit/react';

import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { CallMethodKeys, CallMethodParams, CallMethodResponse } from '@trezor/connect';
import { SerializedError } from '@trezor/connect-common/src/constants/errors';
import { Err, Ok } from '@trezor/type-utils';

import { ConnectCallSource } from '../connectPopupTypes';

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
