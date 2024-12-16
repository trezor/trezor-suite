import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { ERRORS } from '@trezor/connect';
import { createDeferred } from '@trezor/utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { desktopApi } from '@trezor/suite-desktop-api';
import { serializeError } from '@trezor/connect/src/constants/errors';

const CONNECT_POPUP_MODULE = '@common/connect-popup';

export const connectPopupCallThunk = createThunk(
    `${CONNECT_POPUP_MODULE}/callThunk`,
    async (
        {
            id,
            method,
            payload,
            processName,
            origin,
        }: {
            id: number;
            method: string;
            payload: any;
            processName?: string;
            origin?: string;
        },
        { dispatch, getState, extra },
    ) => {
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
                ...payload,
            });

            dispatch(extra.actions.onModalCancel());

            desktopApi.connectPopupResponse({
                ...response,
                id,
            });
        } catch (error) {
            console.error('connectPopupCallThunk', error);
            desktopApi.connectPopupResponse({
                success: false,
                payload: serializeError(error),
                id,
            });
        }
    },
);

export const connectPopupInitThunk = createThunk(
    `${CONNECT_POPUP_MODULE}/initPopupThunk`,
    async (_, { dispatch }) => {
        if (desktopApi.available && (await desktopApi.connectPopupEnabled())) {
            desktopApi.on('connect-popup/call', params => {
                dispatch(connectPopupCallThunk(params));
            });
            desktopApi.connectPopupReady();
        }
    },
);
