import { AsyncThunkAction } from '@reduxjs/toolkit';

import { CustomThunkAPI, createThunk } from '@suite-common/redux-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { CallMethodParams, CallMethodResponse, ERRORS } from '@trezor/connect';
import { serializeError } from '@trezor/connect/src/constants/errors';
import { createDeferred } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';

const CONNECT_POPUP_MODULE = '@common/connect-popup';

type ConnectPopupCallThunkResponse<M extends keyof typeof TrezorConnect> = Promise<{
    id: number;
    success: boolean;
    payload: CallMethodResponse<M>;
}>;

type ConnectPopupCallThunkParams<M extends keyof typeof TrezorConnect> = {
    id: number;
    processName?: string;
    origin?: string;
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
};

export const connectPopupCallThunkInner = createThunk<
    ConnectPopupCallThunkResponse<keyof typeof TrezorConnect>,
    ConnectPopupCallThunkParams<keyof typeof TrezorConnect>
>(
    `${CONNECT_POPUP_MODULE}/callThunk`,
    async ({ id, method, payload, processName, origin }, { dispatch, getState, extra }) => {
        try {
            // @ts-expect-error: method is dynamic
            const methodInfo = await TrezorConnect[method]({
                ...payload,
                __info: true,
            });
            if (!methodInfo.success) {
                throw methodInfo;
            }

            const confirmation = createDeferred();
            dispatch(extra.actions.lockDevice(true));
            dispatch(
                connectPopupActions.initiateCall({
                    method: methodInfo.payload.info,
                    processName,
                    origin,
                    confirmation,
                }),
            );
            await confirmation.promise;

            const device = selectSelectedDevice(getState());
            if (!device) {
                throw ERRORS.TypedError('Device_NotFound');
            }

            // @ts-expect-error: method is dynamic
            const response = await TrezorConnect[method]({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                useEmptyPassphrase: device?.useEmptyPassphrase,
                ...payload,
            });

            return {
                ...response,
                id,
            };
        } catch (error) {
            console.error('connectPopupCallThunk', error);

            return {
                success: false,
                payload: serializeError(error),
                id,
            };
        } finally {
            dispatch(extra.actions.lockDevice(false));
        }
    },
);

// Typed thunk that takes the method as a generic parameter
// Original thunk is exposed as well for using .fulfilled, .rejected, etc.
export const connectPopupCallThunk = <M extends keyof typeof TrezorConnect>(
    params: ConnectPopupCallThunkParams<M>,
): AsyncThunkAction<
    ConnectPopupCallThunkResponse<M>,
    ConnectPopupCallThunkParams<M>,
    CustomThunkAPI
> => connectPopupCallThunkInner(params) as any;
