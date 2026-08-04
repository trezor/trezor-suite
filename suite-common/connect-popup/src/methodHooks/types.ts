import { type Dispatch } from '@reduxjs/toolkit/react';

import { type DeviceRootState } from '@suite-common/device';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    type CallMethodKeys,
    type CallMethodParams,
    type CallMethodResponse,
} from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Err, type Ok } from '@trezor/type-utils';

import { type ConnectPopupStateRootState } from '../connectPopupReducer';
import { type ConnectCallSource } from '../connectPopupTypes';

export type PreCallHookParams<M extends CallMethodKeys> = {
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
    dispatch: Dispatch;
    getState: () => AccountsRootState & DeviceRootState & ConnectPopupStateRootState;
    txSigningPrecomposed?: PrecomposedTransactionFinal;
    source: ConnectCallSource;
};
export type PostCallHookParams<M extends CallMethodKeys> = PreCallHookParams<M> & {
    originalPayload: Omit<CallMethodParams<M>, 'method'>;
    response: Ok<CallMethodResponse<M>> | Err<SerializedError>;
};
