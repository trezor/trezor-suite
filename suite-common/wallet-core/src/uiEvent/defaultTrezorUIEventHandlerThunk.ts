import { type DeviceRootState, deviceActions, selectSelectedDevice } from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type ConnectInitHooksDeps } from '@suite-common/suite-types';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import type { PopupEventMessage, UiEventMessage, UiRequestMessage } from '@trezor/connect-common';
import { type Without } from '@trezor/type-utils';

import { forgetDisconnectedDevicesThunk } from '../device/deviceThunks';

const MODULE = '@common/wallet-core/uiEvent';

export type UiEventAction = Without<UiEventMessage | PopupEventMessage | UiRequestMessage, 'event'>;

export type DefaultTrezorUIEventHandlerThunkState = DeviceRootState & FirmwareRootState;

export type DefaultTrezorUIEventHandlerThunkDeps = WithServices<ConnectInitHooksDeps>;

export const defaultTrezorUIEventHandlerThunk = createThunk<
    void,
    UiEventAction,
    {
        state: DefaultTrezorUIEventHandlerThunkState;
        extra: DefaultTrezorUIEventHandlerThunkDeps;
    }
>(`${MODULE}/defaultTrezorUIEventHandler`, (action, { dispatch, getState, extra }) => {
    const { connectInitHooks } = extra.services;

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
                    // todo: note that this is not 'threadsafe', currently selected device is not necessarily the device
                    // connect call was made for
                    device: selectSelectedDevice(getState()),
                    buttonRequest: {
                        code: action.payload.type ? action.payload.type : action.type,
                    },
                }),
            );
            break;
        case UI_EVENTS.FIRMWARE_TYPE_CHANGED:
            // Switching firmware type wipes the seed, so every passphrase wallet derived from the
            // old one is gone with it. `cachedDevice` is the device as the update started, which
            // outlives the reboots the switch forces.
            dispatch(
                forgetDisconnectedDevicesThunk({
                    device: selectFirmware(getState()).cachedDevice ?? action.payload.device,
                    forceForget: true,
                }),
            );
            break;
        case UI_EVENTS.BUTTON_REQUEST: {
            const { device: _, ...request } = action.payload;
            dispatch(
                deviceActions.addButtonRequest({
                    device: selectSelectedDevice(getState()),
                    buttonRequest: request,
                }),
            );
            break;
        }
    }

    connectInitHooks.uiEvent[action.type]?.();
});
