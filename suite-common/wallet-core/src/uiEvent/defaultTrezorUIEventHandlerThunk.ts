import { type DeviceRootState, deviceActions, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type UiEventAction } from '@suite-common/suite-types';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

const MODULE = '@common/wallet-core/uiEvent';

export type DefaultTrezorUIEventHandlerThunkState = DeviceRootState;

export const defaultTrezorUIEventHandlerThunk = createThunk<
    void,
    UiEventAction,
    { state: DefaultTrezorUIEventHandlerThunkState }
>(`${MODULE}/defaultTrezorUIEventHandler`, (action, { dispatch, getState }) => {
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
});
