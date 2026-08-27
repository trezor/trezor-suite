import { type DeviceRootState, deviceActions } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type ConnectInitHooksDeps } from '@suite-common/suite-types';
import { UI_REQUEST } from '@trezor/connect';
import type { PopupEventMessage, UiEventMessage } from '@trezor/connect-common';
import { type Without } from '@trezor/type-utils';

const MODULE = '@common/wallet-core/uiEvent';

export type UiEventAction = Without<UiEventMessage | PopupEventMessage, 'event'>;

export type DefaultTrezorUIEventHandlerThunkState = DeviceRootState;
export type DefaultTrezorUIEventHandlerThunkDeps = {
    services: ConnectInitHooksDeps;
};

export const defaultTrezorUIEventHandlerThunk = createThunk<
    void,
    UiEventAction,
    {
        state: DefaultTrezorUIEventHandlerThunkState;
        extra: DefaultTrezorUIEventHandlerThunkDeps;
    }
>(`${MODULE}/defaultTrezorUIEventHandler`, (action, { dispatch, extra }) => {
    const { connectInitHooks } = extra.services;

    if (action.type === UI_REQUEST.FIRMWARE_DOWNLOADED) {
        // We are in web therefore we ignore `FIRMWARE_DOWNLOADED` action.
        return;
    }

    dispatch(action);

    switch (action.type) {
        case UI_REQUEST.REQUEST_PIN:
        case UI_REQUEST.INVALID_PIN:
            dispatch(
                deviceActions.addButtonRequest({
                    // Key by the event's own device path, not the selected device (may differ).
                    path: action.payload.device.path,
                    buttonRequest: {
                        code: action.payload.type ? action.payload.type : action.type,
                    },
                }),
            );
            break;
        case UI_REQUEST.REQUEST_BUTTON: {
            const { device, ...request } = action.payload;
            dispatch(
                deviceActions.addButtonRequest({
                    path: device.path,
                    buttonRequest: request,
                }),
            );
            break;
        }
    }

    connectInitHooks.uiEvent[action.type]?.();
});
