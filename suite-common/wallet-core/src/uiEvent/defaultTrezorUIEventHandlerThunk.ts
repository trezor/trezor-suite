import { type DeviceRootState, deviceActions } from '@suite-common/device';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type ConnectInitUiEventHooksDep } from '@suite-common/suite-types';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import type { PopupEventMessage, UiEventMessage, UiRequestMessage } from '@trezor/connect-common';
import { type Without } from '@trezor/type-utils';

const MODULE = '@common/wallet-core/uiEvent';

export type UiEventAction = Without<UiEventMessage | PopupEventMessage | UiRequestMessage, 'event'>;

export type DefaultTrezorUIEventHandlerThunkState = DeviceRootState;

export type DefaultTrezorUIEventHandlerThunkDeps = WithServices<ConnectInitUiEventHooksDep>;

export const defaultTrezorUIEventHandlerThunk = createThunk<
    void,
    UiEventAction,
    {
        state: DefaultTrezorUIEventHandlerThunkState;
        extra: DefaultTrezorUIEventHandlerThunkDeps;
    }
>(`${MODULE}/defaultTrezorUIEventHandler`, (action, { dispatch, extra }) => {
    const { connectInitUiEventHooks } = extra.services;

    if (action.type === UI_EVENTS.FIRMWARE_DOWNLOADED) {
        // We are in web therefore we ignore `FIRMWARE_DOWNLOADED` action.
        return;
    }

    dispatch(action);

    switch (action.type) {
        case UI_REQUESTS.REQUEST_PIN:
        case UI_EVENTS.PIN_INVALID:
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
        case UI_EVENTS.BUTTON_REQUEST: {
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

    connectInitUiEventHooks[action.type]?.();
});
