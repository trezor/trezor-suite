import { AsyncThunkAction } from '@reduxjs/toolkit';

import { CustomThunkAPI, createThunk } from '@suite-common/redux-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { CallMethodParams, CallMethodResponse, ERRORS } from '@trezor/connect';
import { serializeError } from '@trezor/connect/src/constants/errors';
import { desktopApi } from '@trezor/suite-desktop-api';
import { createDeferred } from '@trezor/utils';

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
            const device = selectSelectedDevice(getState());

            if (!device) {
                console.error('Device not found');

                // TODO: wait for device selection and continue
                throw ERRORS.TypedError('Device_NotFound');
            }

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
                extra.actions.openModal({
                    type: 'connect-popup',
                    onCancel: () => confirmation.reject(ERRORS.TypedError('Method_Cancel')),
                    onConfirm: () => confirmation.resolve(),
                    method: methodInfo.payload.info,
                    processName,
                    origin,
                }),
            );
            await confirmation.promise;
            dispatch(extra.actions.lockDevice(false));

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

            dispatch(extra.actions.onModalCancel());

            return {
                ...response,
                id,
            };
        } catch (error) {
            console.error('connectPopupCallThunk', error);
            dispatch(extra.actions.onModalCancel());

            return {
                success: false,
                payload: serializeError(error),
                id,
            };
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

export const connectPopupInitThunk = createThunk(
    `${CONNECT_POPUP_MODULE}/initPopupThunk`,
    async (_, { dispatch }) => {
        if (desktopApi.available && (await desktopApi.connectPopupEnabled())) {
            desktopApi.on('connect-popup/call', async params => {
                // @ts-expect-error: params in desktopApi are not fully typed
                const response = await dispatch(connectPopupCallThunk(params)).unwrap();
                desktopApi.connectPopupResponse(response);
            });
            desktopApi.connectPopupReady();
        }
    },
);
