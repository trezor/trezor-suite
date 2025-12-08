import { Dispatch } from '@reduxjs/toolkit/react';

import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    CallMethodKeys,
    CallMethodParams,
    CallMethodResponse,
    Success,
    Unsuccessful,
} from '@trezor/connect';

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
    response: Success<CallMethodResponse<M>> | Unsuccessful;
};
